import type { Doc, Id } from "../_generated/dataModel";

export type LastSeenEntry = {
  userId: Id<"users">;
  timestamp: number;
};

export type ConversationDoc = Doc<"conversations">;

export const normalizeParticipants = (
  user1: Id<"users">,
  user2: Id<"users">,
) => {
  const [participantA, participantB] =
    String(user1) < String(user2) ? [user1, user2] : [user2, user1];
  return { participantA, participantB };
};

export const buildConversationKey = (user1: Id<"users">, user2: Id<"users">) => {
  const { participantA, participantB } = normalizeParticipants(user1, user2);
  return `${String(participantA)}:${String(participantB)}`;
};

export const safeTwoParticipants = (
  value: unknown,
): [Id<"users">, Id<"users">] | null => {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [first, second] = value;
  if (!first || !second) return null;
  return [first as Id<"users">, second as Id<"users">];
};

export const defaultLastSeen = (
  user1: Id<"users">,
  user2: Id<"users">,
  firstTimestamp: number,
): LastSeenEntry[] => [
  { userId: user1, timestamp: firstTimestamp },
  { userId: user2, timestamp: 0 },
];

export const upsertLastSeen = (
  current: LastSeenEntry[] | undefined,
  userId: Id<"users">,
  timestamp: number,
): LastSeenEntry[] => {
  const existing = current ?? [];
  const hasEntry = existing.some((entry) => entry.userId === userId);

  if (!hasEntry) {
    return [...existing, { userId, timestamp }];
  }

  return existing.map((entry) =>
    entry.userId === userId ? { ...entry, timestamp } : entry,
  );
};

export const mergeConversationsById = (
  asParticipantA: ConversationDoc[],
  asParticipantB: ConversationDoc[],
) => {
  const map = new Map(
    asParticipantA.map((conversation) => [String(conversation._id), conversation]),
  );
  for (const conversation of asParticipantB) {
    map.set(String(conversation._id), conversation);
  }
  return Array.from(map.values());
};

export const toNormalizedLegacyConversation = (
  conversation: ConversationDoc,
): ConversationDoc => {
  const pair = safeTwoParticipants(conversation.participants);
  if (!pair) return conversation;

  const { participantA, participantB } = normalizeParticipants(pair[0], pair[1]);
  return {
    ...conversation,
    conversationKey:
      conversation.conversationKey ??
      buildConversationKey(participantA, participantB),
    participantA: conversation.participantA ?? participantA,
    participantB: conversation.participantB ?? participantB,
    participants: [participantA, participantB],
    lastSeen:
      conversation.lastSeen ??
      [
        { userId: participantA, timestamp: 0 },
        { userId: participantB, timestamp: 0 },
      ],
  };
};
