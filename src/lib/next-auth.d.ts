// C:\DEVELOPER\projects\hug-harmony\src\lib\next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/* =========================
   next-auth session + user
   ========================= */
declare module "next-auth" {
  interface Session {
    accessToken?: string;

    user: {
      id: string;
      email: string;
      username: string | null;
      isAdmin: boolean;
      isModerator: boolean;
      emailVerified: boolean;

      // Profile fields
      name?: string | null;
      profileImage?: string | null;
      firstName?: string | null;
      lastName?: string | null;

      // OAuth provider IDs (optional)
      googleId?: string | null;
      appleId?: string | null;
      facebookId?: string | null;

      timezone?: string | null;
      sex?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    username: string | null;
    isAdmin: boolean;
    isModerator: boolean;
    emailVerified: boolean;

    // Profile fields
    name?: string | null;
    profileImage?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    sex?: string | null;

    // OAuth provider IDs
    googleId?: string | null;
    appleId?: string | null;
    facebookId?: string | null;
  }
}

/* =========================
   next-auth JWT
   ========================= */
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;

    id?: string;
    email?: string;
    username?: string | null;
    isAdmin?: boolean;
    isModerator?: boolean;
    emailVerified?: boolean;

    // OAuth provider IDs (optional)
    googleId?: string | null;
    appleId?: string | null;
    facebookId?: string | null;
    sex?: string | null;
  }
}
