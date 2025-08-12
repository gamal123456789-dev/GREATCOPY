import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      username?: string;
      role?: string;
      isAdmin?: boolean;
      [key: string]: any;
    }
  }
  
  interface User {
    id: string;
    email: string;
    name?: string;
    username?: string;
    role?: string;
  }
  
  interface JWT {
    id: string;
    email: string;
    name?: string;
    username?: string;
    role?: string;
  }
}
