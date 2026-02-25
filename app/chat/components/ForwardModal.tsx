"use client";

import type { Id } from "../../../convex/_generated/dataModel";
import type { ConvDoc, UserDoc } from "../lib/types";

type ForwardModalProps = {
  open: boolean;
  conversations: ConvDoc[];
  users: UserDoc[];
  title: (conversation: ConvDoc) => string;
  onForwardToConversation: (conversationId: Id<"conversations">) => Promise<void>;
  onForwardToUser: (user: UserDoc) => Promise<void>;
  onClose: () => void;
};

export function ForwardModal({
  open,
  conversations,
  users,
  title,
  onForwardToConversation,
  onForwardToUser,
  onClose,
}: ForwardModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
        <h3 className="text-sm font-semibold text-gray-900">Forward message</h3>
        <p className="mt-1 text-xs text-gray-500">Choose a conversation or user</p>

        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <button
              key={conversation._id}
              onClick={() => void onForwardToConversation(conversation._id)}
              className="block w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              {title(conversation)}
            </button>
          ))}

          {users.map((user) => (
            <button
              key={`fwd-${user._id}`}
              onClick={() => void onForwardToUser(user)}
              className="block w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              {user.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded border border-gray-300 px-3 py-1.5 text-xs">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

