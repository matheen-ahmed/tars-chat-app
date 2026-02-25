"use client";

import type { Id } from "../../../convex/_generated/dataModel";
import type { UserDoc } from "../lib/types";

type GroupModalProps = {
  open: boolean;
  groupName: string;
  onGroupNameChange: (value: string) => void;
  groupSearch: string;
  onGroupSearchChange: (value: string) => void;
  filteredGroupUsers: UserDoc[];
  groupMembers: Id<"users">[];
  onToggleGroupMember: (userId: Id<"users">) => void;
  groupErr: string | null;
  groupBusy: boolean;
  onClose: () => void;
  onCreate: () => Promise<void>;
};

export function GroupModal({
  open,
  groupName,
  onGroupNameChange,
  groupSearch,
  onGroupSearchChange,
  filteredGroupUsers,
  groupMembers,
  onToggleGroupMember,
  groupErr,
  groupBusy,
  onClose,
  onCreate,
}: GroupModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2b3942] bg-[#111b21] p-4 shadow-2xl">
        <h2 className="text-xl font-semibold text-[#e9edef]">Create Group</h2>
        <p className="mt-1 text-sm text-[#aebac1]">
          Pick at least 2 members and set a group name.
        </p>

        <input
          value={groupName}
          onChange={(event) => onGroupNameChange(event.target.value)}
          placeholder="Group name"
          className="mt-3 w-full rounded-lg border border-[#2b3942] bg-[#202c33] px-3 py-2 text-sm text-[#e9edef] outline-none placeholder:text-[#8696a0] focus:border-[#00a884]"
        />

        <input
          value={groupSearch}
          onChange={(event) => onGroupSearchChange(event.target.value)}
          placeholder="Search members"
          className="mt-3 w-full rounded-lg border border-[#2b3942] bg-[#202c33] px-3 py-2 text-sm text-[#e9edef] outline-none placeholder:text-[#8696a0] focus:border-[#00a884]"
        />

        <div className="mt-3 max-h-52 overflow-y-auto rounded-lg border border-[#2b3942] bg-[#0f171d]">
          {filteredGroupUsers.map((user) => (
            <label
              key={user._id}
              className="flex cursor-pointer items-center gap-3 border-b border-[#1f2c34] px-3 py-2 hover:bg-[#1a262e]"
            >
              <input
                type="checkbox"
                checked={groupMembers.includes(user._id)}
                onChange={() => onToggleGroupMember(user._id)}
                className="h-4 w-4 accent-[#00a884]"
              />
              <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
              <span className="text-sm font-medium text-[#d1d7db]">{user.name}</span>
            </label>
          ))}

          {filteredGroupUsers.length === 0 && (
            <p className="px-3 py-3 text-sm text-[#8696a0]">No users found.</p>
          )}
        </div>

        {groupErr && <p className="mt-2 text-xs text-red-400">{groupErr}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-[#3b4a54] bg-transparent px-4 py-2 text-sm font-semibold text-[#d1d7db] hover:bg-[#1f2c34]"
          >
            Cancel
          </button>
          <button
            onClick={() => void onCreate()}
            disabled={groupBusy}
            className="rounded-md bg-[#00a884] px-4 py-2 text-sm font-semibold text-white disabled:bg-[#2f655d]"
          >
            {groupBusy ? "Creating..." : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}

