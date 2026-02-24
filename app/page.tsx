"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f8f7_0%,_#ece6dc_42%,_#e7e1d7_100%)]">
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-8 text-center shadow-[0_20px_60px_-30px_rgba(7,94,84,0.45)] backdrop-blur">
            <h1 className="text-4xl font-bold tracking-tight text-[#075e54]">Connect Chat</h1>
            <p className="mt-3 text-sm text-gray-600">
              Sign up or log in to start private real-time conversations.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/sign-up" className="rounded-xl bg-[#25d366] px-4 py-2.5 font-semibold text-white transition hover:bg-[#1fb65a]">
                Create account
              </Link>
              <Link href="/sign-in" className="rounded-xl border border-[#d5d9dc] bg-white px-4 py-2.5 font-semibold text-[#075e54] transition hover:bg-[#f4f7f7]">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-8 text-center shadow-[0_20px_60px_-30px_rgba(7,94,84,0.45)] backdrop-blur">
            <div className="mb-4 flex justify-center">
              <UserButton />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#075e54]">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">Continue to your WhatsApp-style chat workspace.</p>
            <Link href="/chat" className="mt-6 inline-block rounded-xl bg-[#25d366] px-5 py-2.5 font-semibold text-white transition hover:bg-[#1fb65a]">
              Open chats
            </Link>
          </div>
        </div>
      </SignedIn>
    </div>
  );
}
