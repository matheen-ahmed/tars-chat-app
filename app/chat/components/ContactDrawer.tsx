"use client";

import { useState, type ChangeEvent, type RefObject } from "react";
import { X, Pencil } from "lucide-react";
import type { ContactDrawerData } from "./types";

type ContactDrawerProps = {
  contactDrawer: ContactDrawerData | null;
  onClose: () => void;
  profileInputRef: RefObject<HTMLInputElement | null>;
  onPickProfileImage: (event: ChangeEvent<HTMLInputElement>) => void;
  hasPendingProfileImage: boolean;
  profileSaving: boolean;
  onSaveProfileImage: () => Promise<void>;
  onCancelProfileImage: () => void;
  onUpdateProfileName: (name: string) => Promise<boolean>;
};

export function ContactDrawer({
  contactDrawer,
  onClose,
  profileInputRef,
  onPickProfileImage,
  hasPendingProfileImage,
  profileSaving,
  onSaveProfileImage,
  onCancelProfileImage,
  onUpdateProfileName,
}: ContactDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);

  if (!contactDrawer) return null;

  const closeDrawer = () => {
    setEditing(false);
    setNameDraft("");
    setSaving(false);
    onClose();
  };

  const saveName = async () => {
    if (!contactDrawer.canEdit || saving) return;
    setSaving(true);
    const ok = await onUpdateProfileName(nameDraft);
    if (ok) setEditing(false);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={closeDrawer}>
      <div
        className="ml-auto h-full w-full max-w-md bg-[#111b21] px-4 py-3 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <button onClick={closeDrawer} className="rounded-full p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <p className="text-lg font-semibold">Contact info</p>
          {contactDrawer.canEdit ? (
            <button
              onClick={() => {
                setNameDraft(contactDrawer.name);
                setEditing((prev) => !prev);
              }}
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
          {contactDrawer.canEdit && (
            <button
              onClick={() => profileInputRef.current?.click()}
              className="mt-3 rounded-full border border-[#2b3942] bg-[#202c33] px-3 py-1.5 text-xs font-semibold text-[#d1d7db] hover:bg-[#2a3942]"
            >
              Change photo
            </button>
          )}
          {contactDrawer.canEdit && hasPendingProfileImage && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => void onSaveProfileImage()}
                disabled={profileSaving}
                className="rounded-md bg-[#00a884] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0abf9a] disabled:cursor-not-allowed disabled:bg-[#2f655d]"
              >
                {profileSaving ? "Saving..." : "Save photo"}
              </button>
              <button
                onClick={onCancelProfileImage}
                disabled={profileSaving}
                className="rounded-md border border-[#3b4a54] px-3 py-1.5 text-xs font-semibold text-[#d1d7db] hover:bg-[#1f2c34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}

          {!editing ? (
            <p className="mt-5 text-4xl font-semibold leading-tight">{contactDrawer.name}</p>
          ) : (
            <div className="mt-5 w-full max-w-xs">
              <input
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-[#2b3942] bg-[#202c33] px-3 py-2 text-center text-lg font-semibold text-white outline-none focus:border-[#00a884]"
              />
              <div className="mt-3 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setNameDraft(contactDrawer.name);
                  }}
                  className="rounded-md border border-[#3b4a54] px-3 py-1.5 text-xs font-semibold text-[#d1d7db] hover:bg-[#1f2c34]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void saveName()}
                  disabled={saving || !nameDraft.trim()}
                  className="rounded-md bg-[#00a884] px-3 py-1.5 text-xs font-semibold text-white disabled:bg-[#2f655d]"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          {contactDrawer.detail && (
            <p className="mt-2 text-lg text-gray-300">{contactDrawer.detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}
