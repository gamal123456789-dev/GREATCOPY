import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import type { AuthOptions } from "next-auth";
import { authLimiter, getClientIdentifier } from "../../../lib/rateLimiter";
import { v4 as uuidv4 } from "uuid";

// Debug logging for Discord provider configuration
console.log("NextAuth Discord Provider Debug:", {
  clientIdSet: !!process.env.DISCORD_CLIENT_ID,
  clientSecretSet: !!process.env.DISCORD_CLIENT_SECRET,
  clientIdLength: process.env.DISCORD_CLIENT_ID?.length,
  clientSecretLength: process.env.DISCORD_CLIENT_SECRET?.length,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET
});

export const authOptions: AuthOptions = {
  // Using JWT sessions for better compatibility
  // adapter: PrismaAdapter(prisma), // Commented out to avoid conflicts with JWT strategy
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: {
          scope: "identify email guilds",
          response_type: "code",
        },
      },
      token: "https://discord.com/api/oauth2/token",
      userinfo: "https://discord.com/api/users/@me",
      profile(profile) {
        console.log("Discord profile received:", profile);
        return {
          id: profile.id,
          name: profile.username || profile.global_name || `User${profile.id}`,
          email: profile.email,
          image: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
          role: "user",
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Security: Rate limiting for login attempts
        const clientId = getClientIdentifier(req);
        if (!authLimiter.isAllowed(clientId)) {
          console.log(`[SECURITY] Login rate limit exceeded for ${clientId} at ${new Date().toISOString()}`);
          throw new Error('Too many login attempts. Please try again later.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          // Security logging for failed login attempts
          console.log(`[SECURITY] Failed login attempt for ${credentials.email} from ${clientId} at ${new Date().toISOString()}`);
          throw new Error("Invalid email or password");
        }

        const valid = await bcrypt.compare(credentials.password, user.password);

        if (!valid) {
          // Security logging for failed password attempts
          console.log(`[SECURITY] Failed login attempt for ${credentials.email} from ${clientId} at ${new Date().toISOString()}`);
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        // Security logging for successful login
        console.log(`[SECURITY] Successful login for ${credentials.email} from ${clientId} at ${new Date().toISOString()}`);

        return {
          id: user.id,
          email: user.email,
          name: user.username || user.email.split("@")[0],
          role: user.role,
          username: user.username || undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every day
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
      }
      
      // Handle Discord login
      if (account?.provider === "discord" && user) {
        try {
          // Check if user exists in database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!dbUser) {
            // Create new user for Discord login
            dbUser = await prisma.user.create({
              data: {
                id: uuidv4(),
                email: user.email!,
                username: user.name || user.email!.split('@')[0],
                role: 'user',
                emailVerified: new Date(), // Discord emails are considered verified
                image: user.image,
              },
            });
            console.log(`[AUTH] New Discord user created: ${user.email}`);
          } else {
            // Update existing user with Discord info
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                username: user.name || dbUser.username,
                image: user.image || dbUser.image,
                emailVerified: dbUser.emailVerified || new Date(),
              },
            });
            console.log(`[AUTH] Existing user updated with Discord info: ${user.email}`);
          }

          token.role = dbUser.role;
          token.username = dbUser.username;
          token.sub = dbUser.id;
        } catch (error) {
          console.error('[AUTH] Discord user creation/update error:', error);
          throw new Error('Failed to process Discord login');
        }
      }
      
      return token;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        if (!user.email) {
          console.log('[AUTH] Discord login failed: No email provided');
          return false;
        }
        console.log(`[AUTH] Discord login successful for: ${user.email}`);
        return true;
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth",
    signOut: "/auth",
    error: "/auth",
    verifyRequest: "/auth",
    newUser: "/auth"
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`[AUTH] User signed in: ${user.email} via ${account?.provider}`);
      if (isNewUser) {
        console.log(`[AUTH] New user registered: ${user.email}`);
      }
    },
    async session({ session, token }) {
      console.log(`[AUTH] Session accessed for: ${session.user?.email}`);
    },
    async signOut({ token }) {
      console.log("🚪 Sign-out initiated for token:", token?.email);
      
      // Clear token data
      if (token) {
        token.id = undefined;
        token.email = undefined;
        token.role = undefined;
        token.username = undefined;
        token.image = undefined;
        token.name = undefined;
      }
      
      console.log("✅ Sign-out completed");
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.gear-score.com' : undefined
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);