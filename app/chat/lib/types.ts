import type { Doc } from "../../../convex/_generated/dataModel";

export type UserDoc = Doc<"users">;
export type MessageUi = Doc<"messages">;
export type ConvDoc = Doc<"conversations"> & { unreadCount: number };
