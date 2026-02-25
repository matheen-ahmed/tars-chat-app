import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TYPING_TIMEOUT_MS = 2_000;

export const getOrCreateConversation = mutation({
  args: {
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db.query("conversations").collect();

    const existing = conversations.find(
      (conversation) =>
        conversation.participants.length === 2 &&
        conversation.participants.includes(args.user1) &&
        conversation.participants.includes(args.user2)
    );

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      participants: [args.user1, args.user2],
      lastMessage: "",
      lastMessageTime: now,
      lastSeen: [
        { userId: args.user1, timestamp: now },
        { userId: args.user2, timestamp: now },
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

    await ctx.db.patch(conversation._id, {
      lastMessage: trimmedContent,
      lastMessageTime: now,
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
    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((conversation) =>
      conversation.participants.includes(args.userId)
    );

    const now = Date.now();
    const results = await Promise.all(
      myConversations.map(async (conversation) => {
        const seenRecord = conversation.lastSeen.find((lastSeen) => lastSeen.userId === args.userId);
        const lastSeenTimestamp = seenRecord?.timestamp ?? 0;

        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();

        const unreadCount = messages.filter(
          (message) => message.senderId !== args.userId && message.createdAt > lastSeenTimestamp
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

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const now = Date.now();
    const existing = conversation.lastSeen;
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
