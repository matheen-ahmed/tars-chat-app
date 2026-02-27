import type { Id } from "../../../convex/_generated/dataModel";
import type { ConvDoc, UserDoc } from "./types";

export const buildUsersById = (users: UserDoc[] | undefined) => {
  const map = new Map<string, UserDoc>();
  (users || []).forEach((user) => map.set(String(user._id), user));
  return map;
};

export const getOtherParticipantId = (
  conversation: ConvDoc,
  currentUserId: Id<"users"> | undefined
) => conversation.participants.find((participant) => participant !== currentUserId);

export const getConversationTitle = (
  conversation: ConvDoc,
  currentUserId: Id<"users"> | undefined,
  usersById: Map<string, UserDoc>
) => usersById.get(String(getOtherParticipantId(conversation, currentUserId)))?.name || "Conversation";

export const getConversationSubtitle = (
  conversation: ConvDoc,
  currentUserId: Id<"users"> | undefined,
  usersById: Map<string, UserDoc>
) => {
  const other = usersById.get(String(getOtherParticipantId(conversation, currentUserId)));
  return other?.online ? "Online" : "Offline";
};

export const filterDirectConversations = (conversations: ConvDoc[] | undefined) =>
  (conversations || []).filter((conversation) => {
    if (conversation.participants.length !== 2) return false;
    const [a, b] = conversation.participants;
    if (!a || !b) return false;
    return a !== b;
  });
