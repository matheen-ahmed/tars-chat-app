"use client";

import { X } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ContactDrawerData, ConvDoc, MessageDoc, UserDoc } from "../lib/types";
import { ContactDrawer } from "./ContactDrawer";
import { ForwardModal } from "./ForwardModal";
import { GroupModal } from "./GroupModal";

type ChatOverlaysProps = {
  infoMessage: MessageDoc | null;
  usersById: Map<string, UserDoc>;
  formatTimestamp: (value: number) => string;
  onCloseInfo: () => void;
  forwardOpen: boolean;
  conversations: ConvDoc[];
  users: UserDoc[];
  title: (conversation: ConvDoc) => string;
  onForwardToConversation: (targetConversationId: Id<"conversations">) => Promise<void>;
  onForwardToUser: (targetUser: UserDoc) => Promise<void>;
  onCloseForward: () => void;
  contactDrawer: ContactDrawerData | null;
  onCloseContactDrawer: () => void;
  profileInputRef: RefObject<HTMLInputElement | null>;
  onPickProfileImage: (event: ChangeEvent<HTMLInputElement>) => void;
  hasPendingProfileImage: boolean;
  profileSaving: boolean;
  onSaveProfileImage: () => Promise<void>;
  onCancelProfileImage: () => void;
  onUpdateProfileName: (name: string) => Promise<boolean>;
  imagePreviewUrl: string | null;
  imagePreviewName: string;
  onCloseImagePreview: () => void;
  renameModalOpen: boolean;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onCloseRenameModal: () => void;
  onConfirmRenameGroup: () => Promise<void>;
  groupActionBusy: boolean;
  deleteModalOpen: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDeleteGroup: () => Promise<void>;
  groupOpen: boolean;
  groupName: string;
  onGroupNameChange: (value: string) => void;
  groupSearch: string;
  onGroupSearchChange: (value: string) => void;
  filteredGroupUsers: UserDoc[];
  groupMembers: Id<"users">[];
  onToggleGroupMember: (uid: Id<"users">) => void;
  groupErr: string | null;
  groupBusy: boolean;
  onCloseGroupModal: () => void;
  onCreateGroup: () => Promise<void>;
};

export function ChatOverlays({
  infoMessage,
  usersById,
  formatTimestamp,
  onCloseInfo,
  forwardOpen,
  conversations,
  users,
  title,
  onForwardToConversation,
  onForwardToUser,
  onCloseForward,
  contactDrawer,
  onCloseContactDrawer,
  profileInputRef,
  onPickProfileImage,
  hasPendingProfileImage,
  profileSaving,
  onSaveProfileImage,
  onCancelProfileImage,
  onUpdateProfileName,
  imagePreviewUrl,
  imagePreviewName,
  onCloseImagePreview,
  renameModalOpen,
  renameValue,
  onRenameValueChange,
  onCloseRenameModal,
  onConfirmRenameGroup,
  groupActionBusy,
  deleteModalOpen,
  onCloseDeleteModal,
  onConfirmDeleteGroup,
  groupOpen,
  groupName,
  onGroupNameChange,
  groupSearch,
  onGroupSearchChange,
  filteredGroupUsers,
  groupMembers,
  onToggleGroupMember,
  groupErr,
  groupBusy,
  onCloseGroupModal,
  onCreateGroup,
}: ChatOverlaysProps) {
  return (
    <>
      {infoMessage && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900">Message info</h3>
            <p className="mt-2 text-xs text-gray-500">
              Sent by: {usersById.get(String(infoMessage.senderId))?.name || "Unknown"}
            </p>
            <p className="text-xs text-gray-500">Time: {formatTimestamp(infoMessage.createdAt)}</p>
            <p className="text-xs text-gray-500">Seen by: {infoMessage.seenBy.length}</p>
            <div className="mt-3 rounded-md bg-gray-50 p-2 text-sm text-gray-700">
              {infoMessage.content}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={onCloseInfo}
                className="rounded bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ForwardModal
        open={forwardOpen}
        conversations={conversations}
        users={users}
        title={title}
        onForwardToConversation={onForwardToConversation}
        onForwardToUser={onForwardToUser}
        onClose={onCloseForward}
      />

      <ContactDrawer
        contactDrawer={contactDrawer}
        onClose={onCloseContactDrawer}
        profileInputRef={profileInputRef}
        onPickProfileImage={onPickProfileImage}
        hasPendingProfileImage={hasPendingProfileImage}
        profileSaving={profileSaving}
        onSaveProfileImage={() => void onSaveProfileImage()}
        onCancelProfileImage={onCancelProfileImage}
        onUpdateProfileName={onUpdateProfileName}
      />

      {imagePreviewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={onCloseImagePreview}
        >
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between rounded-lg bg-[#111b21] px-3 py-2 text-white">
              <p className="truncate text-sm text-[#d1d7db]">{imagePreviewName}</p>
              <button
                onClick={onCloseImagePreview}
                className="rounded-full p-1 text-[#d1d7db] hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={imagePreviewUrl}
              alt={imagePreviewName}
              className="max-h-[78vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {renameModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#2b3942] bg-[#111b21] p-4 shadow-2xl">
            <h3 className="text-base font-semibold text-[#e9edef]">Rename group</h3>
            <p className="mt-1 text-sm text-[#aebac1]">Enter a new group name.</p>
            <input
              value={renameValue}
              onChange={(event) => onRenameValueChange(event.target.value)}
              placeholder="Group name"
              className="mt-3 w-full rounded-lg border border-[#2b3942] bg-[#202c33] px-3 py-2 text-sm text-[#e9edef] outline-none placeholder:text-[#8696a0] focus:border-[#00a884]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onCloseRenameModal}
                className="rounded-md border border-[#3b4a54] px-4 py-2 text-sm font-semibold text-[#d1d7db] hover:bg-[#1f2c34]"
              >
                Cancel
              </button>
              <button
                onClick={() => void onConfirmRenameGroup()}
                disabled={groupActionBusy || !renameValue.trim()}
                className="rounded-md bg-[#00a884] px-4 py-2 text-sm font-semibold text-white disabled:bg-[#2f655d]"
              >
                {groupActionBusy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#2b3942] bg-[#111b21] p-4 shadow-2xl">
            <h3 className="text-base font-semibold text-[#e9edef]">Delete group</h3>
            <p className="mt-1 text-sm text-[#aebac1]">
              Delete this group for everyone? This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onCloseDeleteModal}
                className="rounded-md border border-[#3b4a54] px-4 py-2 text-sm font-semibold text-[#d1d7db] hover:bg-[#1f2c34]"
              >
                Cancel
              </button>
              <button
                onClick={() => void onConfirmDeleteGroup()}
                disabled={groupActionBusy}
                className="rounded-md bg-[#b42318] px-4 py-2 text-sm font-semibold text-white disabled:bg-[#7a2a26]"
              >
                {groupActionBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <GroupModal
        open={groupOpen}
        groupName={groupName}
        onGroupNameChange={onGroupNameChange}
        groupSearch={groupSearch}
        onGroupSearchChange={onGroupSearchChange}
        filteredGroupUsers={filteredGroupUsers}
        groupMembers={groupMembers}
        onToggleGroupMember={onToggleGroupMember}
        groupErr={groupErr}
        groupBusy={groupBusy}
        onClose={onCloseGroupModal}
        onCreate={() => void onCreateGroup()}
      />
    </>
  );
}
