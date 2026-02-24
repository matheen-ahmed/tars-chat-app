"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f8f7_0%,_#e9f1ff_42%,_#e4ebf5_100%)]">
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-8 text-center shadow-[0_20px_60px_-30px_rgba(7,94,84,0.45)] backdrop-blur">
            <Image
              src="/quickchat-logo.svg"
              alt="QuickChat logo"
              width={120}
              height={120}
              className="mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold tracking-tight text-[#0F4AAF]">QuickChat</h1>
            <p className="mt-3 text-sm text-gray-600">
              Fast, secure messaging for teams and friends.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/sign-up" className="rounded-xl bg-[#2D8CFF] px-4 py-2.5 font-semibold text-white transition hover:bg-[#1D74E2]">
                Create account
              </Link>
              <Link href="/sign-in" className="rounded-xl border border-[#d5d9dc] bg-white px-4 py-2.5 font-semibold text-[#0F4AAF] transition hover:bg-[#f4f7f7]">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-8 text-center shadow-[0_20px_60px_-30px_rgba(7,94,84,0.45)] backdrop-blur">
            <Image
              src="/quickchat-mark.svg"
              alt="QuickChat mark"
              width={72}
              height={72}
              className="mx-auto mb-4"
            />
            <div className="mb-4 flex justify-center">
              <UserButton />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#0F4AAF]">Welcome to QuickChat</h2>
            <p className="mt-2 text-sm text-gray-600">Continue to your real-time chat workspace.</p>
            <Link href="/chat" className="mt-6 inline-block rounded-xl bg-[#2D8CFF] px-5 py-2.5 font-semibold text-white transition hover:bg-[#1D74E2]">
              Open QuickChat
            </Link>
          </div>
        </div>
      </SignedIn>
    </div>
  );
}
