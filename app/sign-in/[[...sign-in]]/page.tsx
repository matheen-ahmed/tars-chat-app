"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f8f7_0%,_#e9f1ff_42%,_#e4ebf5_100%)] p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center gap-8">
        <div className="hidden max-w-sm rounded-3xl border border-white/50 bg-white/70 p-8 shadow-[0_20px_60px_-30px_rgba(7,94,84,0.45)] backdrop-blur lg:block">
          <Image src="/quickchat-logo.svg" alt="QuickChat logo" width={88} height={88} />
          <h1 className="mt-4 text-3xl font-bold text-[#0F4AAF]">QuickChat</h1>
          <p className="mt-3 text-sm text-gray-600">Private messaging with clean, fast conversations.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[#0F4AAF] underline">
            Back to home
          </Link>
        </div>
        <div className="flex w-full justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full flex justify-center",
                card: "w-full max-w-md rounded-3xl border border-white/50 bg-white/95 shadow-[0_20px_60px_-30px_rgba(7,94,84,0.45)]",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
