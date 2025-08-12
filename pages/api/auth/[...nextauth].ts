import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import type { AuthOptions } from "next-auth";
import { authLimiter, getClientIdentifier } from "../../../lib/rateLimiter";
import { v4 as uuidv4 } from "uuid";

export const authOptions: AuthOptions = {
  // Using JWT sessions for better compatibility
  // adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: {
          scope: "identify email",
          response_type: "code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`,
          prompt: "consent",
          access_type: "offline",
        },
      },
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
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
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              password: true,
              role: true,
              username: true,
              emailVerified: true,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username || undefined,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days - longer for better UX
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string || "user";
        session.user.isAdmin = (token.role as string) === "ADMIN";
        session.user.username = token.username as string || token.name as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string || token.username as string;
        session.user.image = token.image as string;
      }

      return session;
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in - store user data in token
      if (account && user) {
        console.log("🔐 Initial token creation for user:", user.email);
        
        if (account.provider === "discord") {
          // Discord OAuth flow
          if (!user.email) {
            console.error("❌ Discord user missing email");
            return token;
          }

          try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
                emailVerified: true,
              },
            });

            if (existingUser) {
              // Link Discord account to existing user
              console.log("🔗 Linking Discord account to existing user:", existingUser.email);
              
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  image: user?.image || undefined,
                  name: user?.name || existingUser.username,
                  emailVerified: new Date(), // Discord users are verified
                },
              });

              return {
                ...token,
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
                username: existingUser.username,
                image: user?.image,
                name: user?.name || existingUser.username,
              };
            } else {
              // Create new user from Discord
              console.log("🆕 Creating new user from Discord:", user.email);
              
              const newUser = await prisma.user.create({
                data: {
                  id: uuidv4(),
                  email: user.email,
                  username: user.name || `user_${Date.now()}`,
                  role: "user",
                  emailVerified: new Date(),
                  image: user.image,
                  name: user.name,
                },
              });

              return {
                ...token,
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                username: newUser.username,
                image: newUser.image,
                name: newUser.name,
              };
            }
          } catch (error) {
            console.error("❌ Discord account linking error:", error);
            return token;
          }
        } else {
          // Credentials flow
          return {
            ...token,
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username || undefined,
            emailVerified: (user as any).emailVerified,
          };
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.exp as number * 1000)) {
        return token;
      }

      // Access token has expired, try to update it
      try {
        const refreshedUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            role: true,
            username: true,
            emailVerified: true,
            image: true,
            name: true,
          },
        });

        if (refreshedUser) {
          console.log("🔄 Refreshing token for user:", refreshedUser.email);
          return {
            ...token,
            id: refreshedUser.id,
            email: refreshedUser.email,
            role: refreshedUser.role,
            username: refreshedUser.username,
            emailVerified: refreshedUser.emailVerified,
            image: refreshedUser.image,
            name: refreshedUser.name,
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
          };
        }
      } catch (error) {
        console.error("❌ Token refresh error:", error);
      }

      return token;
    },
    async signIn({ user, account, profile }) {
      console.log("🔐 Sign-in attempt:", { email: user.email, provider: account?.provider });
      
      if (account?.provider === "discord") {
        if (!user?.email) {
          console.error("❌ Discord sign-in missing email");
          return false;
        }
        console.log("✅ Discord sign-in successful for:", user.email);
        return true;
      }
      
      return true;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  events: {
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
        maxAge: 30 * 24 * 60 * 60, // 30 days - match session maxAge
        domain: undefined // Remove domain restriction to fix logout issues
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' // Set to true for production domain
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' // Set to true for production domain
      }
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Set to true for production domain
        maxAge: 900 // 15 minutes
      }
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Set to true for production domain
        maxAge: 900 // 15 minutes
      }
    }
  },
  debug: process.env.NODE_ENV === 'development', // Only enable debug in development
  useSecureCookies: process.env.NODE_ENV === 'production'
};

export default NextAuth(authOptions);