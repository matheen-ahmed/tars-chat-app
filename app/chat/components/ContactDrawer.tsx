"use client";

import type { ChangeEvent, RefObject } from "react";
import { X, Pencil } from "lucide-react";
import type { ContactDrawerData } from "./types";

type ContactDrawerProps = {
  contactDrawer: ContactDrawerData | null;
  onClose: () => void;
  profileInputRef: RefObject<HTMLInputElement | null>;
  onPickProfileImage: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function ContactDrawer({
  contactDrawer,
  onClose,
  profileInputRef,
  onPickProfileImage,
}: ContactDrawerProps) {
  if (!contactDrawer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-md bg-[#111b21] px-4 py-3 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <p className="text-lg font-semibold">Contact info</p>
          {contactDrawer.canEdit ? (
            <button
              onClick={() => profileInputRef.current?.click()}
              className="rounded-full p-1 hover:bg-white/10"
            >
              <Pencil className="h-5 w-5" />
            </button>
          ) : (
            <div className="h-7 w-7" />
          )}
        </div>

        <input
          ref={profileInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => void onPickProfileImage(event)}
          className="hidden"
        />

        <div className="flex flex-col items-center pt-4">
          <img
            src={contactDrawer.image}
            alt={contactDrawer.name}
            className="h-40 w-40 rounded-full object-cover shadow-lg"
          />
          <p className="mt-5 text-4xl font-semibold leading-tight">{contactDrawer.name}</p>
          {contactDrawer.detail && (
            <p className="mt-2 text-lg text-gray-300">{contactDrawer.detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}
