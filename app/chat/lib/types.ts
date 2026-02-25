import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type UserDoc = Doc<"users">;
export type MessageDoc = Doc<"messages">;
export type ConvDoc = Doc<"conversations"> & { unreadCount: number };

export type MessageUi = MessageDoc & {
  replyTo?: Id<"messages">;
  forwarded?: boolean;
  pinnedBy?: Id<"users">[];
  starredBy?: Id<"users">[];
  attachment?: {
    storageId: Id<"_storage">;
    fileName: string;
    mimeType: string;
    size: number;
    url?: string | null;
  };
};

export type ContactDrawerData = {
  name: string;
  image: string;
  detail?: string;
  canEdit?: boolean;
};
