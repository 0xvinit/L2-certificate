"use client";
import { PrivyProvider as P } from "@privy-io/react-auth";
import { ReactNode } from "react";

export default function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string;
  return (
    <P
      appId={appId}
      config={{
        loginMethods: ["email", "wallet"],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      {children}
    </P>
  );
}


