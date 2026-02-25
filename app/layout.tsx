"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const convexClient = useMemo(() => {
    if (!convexUrl) return null;
    try {
      return new ConvexReactClient(convexUrl);
    } catch {
      return null;
    }
  }, [convexUrl]);

  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {convexClient ? (
            <ConvexProvider client={convexClient}>{children}</ConvexProvider>
          ) : (
            <main className="flex min-h-screen items-center justify-center bg-[#0b141a] p-6 text-center text-[#d1d7db]">
              <div className="max-w-xl rounded-xl border border-[#2b3942] bg-[#111b21] p-5">
                <h1 className="text-lg font-semibold text-white">Chat configuration error</h1>
                <p className="mt-2 text-sm">
                  Set a valid <code>NEXT_PUBLIC_CONVEX_URL</code> in your environment and redeploy.
                </p>
              </div>
            </main>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
