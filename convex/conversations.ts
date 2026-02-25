import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const TYPING_TIMEOUT_MS = 2_000;

const normalizeParticipants = (user1: Id<"users">, user2: Id<"users">) => {
  const [participantA, participantB] =
    String(user1) < String(user2) ? [user1, user2] : [user2, user1];
  return { participantA, participantB };
};

const buildConversationKey = (user1: Id<"users">, user2: Id<"users">) => {
  const { participantA, participantB } = normalizeParticipants(user1, user2);
  return `${String(participantA)}:${String(participantB)}`;
};

export const getOrCreateConversation = mutation({
  args: {
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, args) => {
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
        lastSeen: { userId: Id<"users">; timestamp: number }[];
      }> = {};
      if (!existing.conversationKey) updates.conversationKey = conversationKey;
      if (!existing.participantA) updates.participantA = participantA;
      if (!existing.participantB) updates.participantB = participantB;
      if (existing.participants.length !== 2) updates.participants = [participantA, participantB];
      if (!existing.lastSeen) {
        updates.lastSeen = [
          { userId: args.user1, timestamp: Date.now() },
          { userId: args.user2, timestamp: 0 },
        ];
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
      }
      return existing._id;
    }

    // Backward-compatibility fallback for legacy rows that predate conversationKey.
    const legacyConversations = await ctx.db.query("conversations").collect();
    const legacyExisting = legacyConversations.find(
      (conversation) =>
        conversation.participants.length === 2 &&
        conversation.participants.includes(args.user1) &&
        conversation.participants.includes(args.user2)
    );
    if (legacyExisting) {
      await ctx.db.patch(legacyExisting._id, {
        conversationKey,
        participantA,
        participantB,
        participants: [participantA, participantB],
        lastSeen: legacyExisting.lastSeen ?? [
          { userId: args.user1, timestamp: Date.now() },
          { userId: args.user2, timestamp: 0 },
        ],
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
      lastSeen: [
        { userId: args.user1, timestamp: now },
        { userId: args.user2, timestamp: 0 },
      ],
      typing: {
        userId: args.user1,
        isTyping: false,
        updatedAt: now,
      },
    });
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    if (!conversation.participants.includes(args.senderId)) return null;

    const trimmedContent = args.content.trim();
    if (!trimmedContent) return null;

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation._id,
      senderId: args.senderId,
      content: trimmedContent,
      createdAt: now,
      seenBy: [args.senderId],
    });

    const lastSeen = conversation.lastSeen ?? [];
    const hasSenderLastSeen = lastSeen.some((entry) => entry.userId === args.senderId);
    const nextLastSeen = hasSenderLastSeen
      ? lastSeen.map((entry) =>
          entry.userId === args.senderId ? { ...entry, timestamp: now } : entry
        )
      : [...lastSeen, { userId: args.senderId, timestamp: now }];

    await ctx.db.patch(conversation._id, {
      lastMessage: trimmedContent,
      lastMessageTime: now,
      lastSeen: nextLastSeen,
      typing: {
        userId: args.senderId,
        isTyping: false,
        updatedAt: now,
      },
    });

    return messageId;
  },
});

export const getConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
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

    const conversationMap = new Map(
      asParticipantA.map((conversation) => [String(conversation._id), conversation])
    );
    for (const conversation of asParticipantB) {
      conversationMap.set(String(conversation._id), conversation);
    }
    let myConversations = Array.from(conversationMap.values());

    // Backward-compatibility fallback for legacy rows without indexed participant fields.
    if (myConversations.length === 0) {
      const legacyConversations = await ctx.db.query("conversations").collect();
      const legacyMine = legacyConversations.filter((conversation) =>
        conversation.participants.includes(args.userId)
      );

      myConversations = legacyMine.map((conversation) => {
        const { participantA, participantB } = normalizeParticipants(
          conversation.participants[0],
          conversation.participants[1]
        );
        return {
          ...conversation,
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
        };
      });
    }

    const now = Date.now();
    const results = await Promise.all(
      myConversations.map(async (conversation) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();

        const unreadCount = messages.filter(
          (message) => message.senderId !== args.userId && !message.seenBy.includes(args.userId)
        ).length;

        const typingExpired =
          conversation.typing?.isTyping && now - conversation.typing.updatedAt > TYPING_TIMEOUT_MS;

        return {
          ...conversation,
          typing:
            typingExpired && conversation.typing
              ? {
                  userId: conversation.typing.userId,
                  isTyping: false,
                  updatedAt: conversation.typing.updatedAt,
                }
              : conversation.typing,
          unreadCount,
        };
      })
    );

    return results.sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
  },
});

export const backfillConversationIndexes = mutation({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query("conversations").collect();

    for (const conversation of conversations) {
      if (conversation.participants.length !== 2) continue;
      const { participantA, participantB } = normalizeParticipants(
        conversation.participants[0],
        conversation.participants[1]
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
    const conversations = await ctx.db.query("conversations").collect();
    let patched = 0;

    for (const conversation of conversations) {
      if (conversation.participants.length !== 2) continue;
      if (!conversation.participants.includes(args.userId)) continue;

      const { participantA, participantB } = normalizeParticipants(
        conversation.participants[0],
        conversation.participants[1]
      );

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

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      if (message.senderId === args.userId) continue;
      if (message.seenBy.includes(args.userId)) continue;
      await ctx.db.patch(message._id, {
        seenBy: [...message.seenBy, args.userId],
      });
    }

    const now = Math.max(Date.now(), conversation.lastMessageTime ?? 0);
    const existing = conversation.lastSeen ?? [];
    const hasEntry = existing.some((entry) => entry.userId === args.userId);

    const updatedLastSeen = hasEntry
      ? existing.map((entry) =>
          entry.userId === args.userId ? { ...entry, timestamp: now } : entry
        )
      : [...existing, { userId: args.userId, timestamp: now }];

    await ctx.db.patch(args.conversationId, {
      lastSeen: updatedLastSeen,
    });
  },
});

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;
    if (!conversation.participants.includes(args.userId)) return;

    await ctx.db.patch(conversation._id, {
      typing: {
        userId: args.userId,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      },
    });
  },
});
