// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier from your database (_id.toString()) */
      id: string;
      // You can add other custom properties from your token/session callback here
      // e.g., userTag?: string;
    } & DefaultSession["user"]; // Keep the default properties (name, email, image)
  }

  /**
   * The shape of the user object returned in the OAuth profile or database,
   * or the object returned by the `authorize` callback.
   */
  interface User extends DefaultUser {
    // This should match the structure returned by `authorize` or used in `signIn`
    id: string;
    // Add any other properties your User model might have that are used in callbacks
  }
}

// Extend the JWT type to include the properties you add in the `jwt` callback
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** User's unique identifier (_id.toString()) */
    id: string;
    // Add any other custom properties you add to the JWT token in the jwt callback
    // e.g., userTag?: string;
    // Note: `picture` is already part of DefaultJWT
  }
}