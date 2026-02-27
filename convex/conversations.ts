import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  buildConversationKey,
  defaultLastSeen,
  type LastSeenEntry,
  mergeConversationsById,
  normalizeParticipants,
  safeTwoParticipants,
  toNormalizedLegacyConversation,
} from "./utils/conversationUtils";

async function requireAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const me = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!me) throw new Error("User profile not found");
  return me;
}

export const getOrCreateConversation = mutation({
  args: {
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const me = await requireAuthUser(ctx);
    if (args.user1 !== me._id) {
      throw new Error("Forbidden");
    }

    const { participantA, participantB } = normalizeParticipants(args.user1, args.user2);
    const conversationKey = buildConversationKey(args.user1, args.user2);

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_conversationKey", (q) => q.eq("conversationKey", conversationKey))
      .unique();

    if (existing) {
      const updates: Partial<{
        conversationKey: string;
        participantA: Id<"users">;
        participantB: Id<"users">;
        participants: Id<"users">[];
        lastSeen: LastSeenEntry[];
      }> = {};

      if (!existing.conversationKey) updates.conversationKey = conversationKey;
      if (!existing.participantA) updates.participantA = participantA;
      if (!existing.participantB) updates.participantB = participantB;
      if (existing.participants.length !== 2) updates.participants = [participantA, participantB];
      if (!existing.lastSeen) updates.lastSeen = defaultLastSeen(args.user1, args.user2, Date.now());

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
      }

      return existing._id;
    }

    // Backward-compatibility fallback for legacy rows that predate conversationKey.
    const legacyConversations = await ctx.db.query("conversations").collect();
    const legacyExisting = legacyConversations.find((conversation) => {
      const pair = safeTwoParticipants(conversation.participants);
      if (!pair) return false;
      return pair.includes(args.user1) && pair.includes(args.user2);
    });

    if (legacyExisting) {
      await ctx.db.patch(legacyExisting._id, {
        conversationKey,
        participantA,
        participantB,
        participants: [participantA, participantB],
        lastSeen: legacyExisting.lastSeen ?? defaultLastSeen(args.user1, args.user2, Date.now()),
      });
      return legacyExisting._id;
    }

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      conversationKey,
      participantA,
      participantB,
      participants: [participantA, participantB],
      lastMessage: "",
      lastMessageTime: now,
      lastSeen: defaultLastSeen(args.user1, args.user2, now),
      typing: {
        userId: args.user1,
        isTyping: false,
        updatedAt: now,
      },
    });
  },
});

export const getConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const me = await requireAuthUser(ctx);
    if (args.userId !== me._id) {
      throw new Error("Forbidden");
    }

    const [asParticipantA, asParticipantB] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_participantA", (q) => q.eq("participantA", args.userId))
        .collect(),
      ctx.db
        .query("conversations")
        .withIndex("by_participantB", (q) => q.eq("participantB", args.userId))
        .collect(),
    ]);

    let myConversations = mergeConversationsById(asParticipantA, asParticipantB);

    // Backward-compatibility fallback for legacy rows without indexed participant fields.
    if (myConversations.length === 0) {
      const legacyConversations = await ctx.db.query("conversations").collect();
      const legacyMine = legacyConversations.filter((conversation) => {
        const pair = safeTwoParticipants(conversation.participants);
        if (!pair) return false;
        return pair.includes(args.userId);
      });

      myConversations = legacyMine.map(toNormalizedLegacyConversation);
    }

    const results = await Promise.all(
      myConversations.map(async (conversation) => {
        const lastSeenEntries = conversation.lastSeen ?? [];
        const seenRecord = lastSeenEntries.find((entry) => entry.userId === args.userId);
        const lastSeenTimestamp = seenRecord?.timestamp ?? 0;

        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_createdAt", (q) =>
            q.eq("conversationId", conversation._id).gt("createdAt", lastSeenTimestamp),
          )
          .collect();

        const unreadCount = unreadMessages.filter(
          (message) => message.senderId !== args.userId,
        ).length;

        return {
          ...conversation,
          typing: conversation.typing,
          unreadCount,
        };
      }),
    );

    return results.sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
  },
});

export const backfillConversationIndexes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthUser(ctx);

    const conversations = await ctx.db.query("conversations").collect();

    for (const conversation of conversations) {
      if (conversation.participants.length !== 2) continue;
      const { participantA, participantB } = normalizeParticipants(
        conversation.participants[0],
        conversation.participants[1],
      );

      await ctx.db.patch(conversation._id, {
        conversationKey: conversation.conversationKey ?? buildConversationKey(participantA, participantB),
        participantA: conversation.participantA ?? participantA,
        participantB: conversation.participantB ?? participantB,
        participants: [participantA, participantB],
        lastSeen:
          conversation.lastSeen ??
          [
            { userId: participantA, timestamp: 0 },
            { userId: participantB, timestamp: 0 },
          ],
      });
    }

    return true;
  },
});

export const backfillConversationsForUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const me = await requireAuthUser(ctx);
    if (args.userId !== me._id) {
      throw new Error("Forbidden");
    }

    const conversations = await ctx.db.query("conversations").collect();
    let patched = 0;

    for (const conversation of conversations) {
      const pair = safeTwoParticipants(conversation.participants);
      if (!pair) continue;
      if (!pair.includes(args.userId)) continue;

      const { participantA, participantB } = normalizeParticipants(pair[0], pair[1]);
      const nextLastSeen =
        conversation.lastSeen ??
        [
          { userId: participantA, timestamp: 0 },
          { userId: participantB, timestamp: 0 },
        ];

      const needsPatch =
        !conversation.conversationKey ||
        !conversation.participantA ||
        !conversation.participantB ||
        conversation.participants[0] !== participantA ||
        conversation.participants[1] !== participantB ||
        !conversation.lastSeen;

      if (!needsPatch) continue;

      await ctx.db.patch(conversation._id, {
        conversationKey: buildConversationKey(participantA, participantB),
        participantA,
        participantB,
        participants: [participantA, participantB],
        lastSeen: nextLastSeen,
      });
      patched += 1;
    }

    return patched;
  },
});

// Backward-compatible exports; canonical modules are ./messages and ./presence.
export { getMessages, markAsRead, sendMessage } from "./messages";
export { setTyping } from "./presence";
