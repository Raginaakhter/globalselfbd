"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "1058202288804-mpuaqjev1h8hh80edggke86iq28n184o.apps.googleusercontent.com";

export default function GoogleAuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
