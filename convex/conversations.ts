import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TYPING_TIMEOUT_MS = 2_000;

// Create or return existing one-on-one conversation.
export const getOrCreateConversation = mutation({
  args: {
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db.query("conversations").collect();

    const existing = conversations.find(
      (conv) =>
        !conv.isGroup &&
        conv.participants.length === 2 &&
        conv.participants.includes(args.user1) &&
        conv.participants.includes(args.user2)
    );

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      participants: [args.user1, args.user2],
      isGroup: false,
      createdBy: args.user1,
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

export const createGroupConversation = mutation({
  args: {
    creatorId: v.id("users"),
    memberIds: v.array(v.id("users")),
    groupName: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedName = args.groupName.trim();
    if (!trimmedName) return null;

    const uniqueMembersMap = new Map<string, (typeof args.memberIds)[number]>();
    for (const memberId of [...args.memberIds, args.creatorId]) {
      uniqueMembersMap.set(String(memberId), memberId);
    }
    const participants = Array.from(uniqueMembersMap.values());

    if (participants.length < 3) {
      return null;
    }
    const now = Date.now();

    return await ctx.db.insert("conversations", {
      participants,
      isGroup: true,
      groupName: trimmedName,
      createdBy: args.creatorId,
      lastMessage: "",
      lastMessageTime: now,
      lastSeen: participants.map((userId) => ({
        userId,
        timestamp: now,
      })),
      typing: {
        userId: args.creatorId,
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

    const sorted = messages.sort((a, b) => a.createdAt - b.createdAt);
    return Promise.all(
      sorted.map(async (message) => ({
        ...message,
        attachment: message.attachment
          ? {
              ...message.attachment,
              url: await ctx.storage.getUrl(message.attachment.storageId),
            }
          : undefined,
      }))
    );
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    attachment: v.optional(
      v.object({
        storageId: v.id("_storage"),
        fileName: v.string(),
        mimeType: v.string(),
        size: v.number(),
      })
    ),
    replyTo: v.optional(v.id("messages")),
    forwarded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    if (!conversation.participants.includes(args.senderId)) return null;

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation._id,
      senderId: args.senderId,
      content: args.content,
      attachment: args.attachment,
      replyTo: args.replyTo,
      forwarded: args.forwarded ?? false,
      createdAt: now,
      seenBy: [args.senderId],
      deletedFor: [],
      deletedForEveryone: false,
      pinnedBy: [],
      starredBy: [],
    });

    await ctx.db.patch(conversation._id, {
      lastMessage: args.attachment
        ? `📎 ${args.attachment.fileName}`
        : args.content,
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

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return false;
    if (message.senderId !== args.userId) return false;
    if (message.deletedForEveryone) return false;

    const nextContent = args.content.trim();
    if (!nextContent) return false;

    await ctx.db.patch(args.messageId, {
      content: nextContent,
    });

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation) return true;

    const conversationMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
      .collect();

    const latestMessage = conversationMessages.sort(
      (a, b) => b.createdAt - a.createdAt
    )[0];

    if (latestMessage && latestMessage._id === args.messageId) {
      await ctx.db.patch(conversation._id, {
        lastMessage: nextContent,
      });
    }

    return true;
  },
});

export const togglePin = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const pinnedBy = message.pinnedBy || [];
    const isPinned = pinnedBy.includes(args.userId);

    await ctx.db.patch(args.messageId, {
      pinnedBy: isPinned
        ? pinnedBy.filter((id) => id !== args.userId)
        : [...pinnedBy, args.userId],
    });
  },
});

export const toggleStar = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const starredBy = message.starredBy || [];
    const isStarred = starredBy.includes(args.userId);

    await ctx.db.patch(args.messageId, {
      starredBy: isStarred
        ? starredBy.filter((id) => id !== args.userId)
        : [...starredBy, args.userId],
    });
  },
});

export const getConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((conv) =>
      conv.participants.includes(args.userId)
    );

    const now = Date.now();
    const results: Array<(typeof myConversations)[number] & { unreadCount: number }> = [];

    for (const conv of myConversations) {
      const seenRecord = conv.lastSeen?.find((ls) => ls.userId === args.userId);
      const lastSeenTimestamp = seenRecord?.timestamp ?? 0;

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();

      const unreadCount = messages.filter(
        (msg) => msg.senderId !== args.userId && msg.createdAt > lastSeenTimestamp
      ).length;

      const typingExpired =
        conv.typing?.isTyping &&
        now - conv.typing.updatedAt > TYPING_TIMEOUT_MS;

      results.push({
        ...conv,
        typing: typingExpired
          ? {
              userId: conv.typing!.userId,
              isTyping: false,
              updatedAt: conv.typing!.updatedAt,
            }
          : conv.typing,
        unreadCount,
      });
    }

    return results.sort(
      (a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0)
    );
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

export const getUnreadCount = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return 0;

    const userLastSeen = conversation.lastSeen?.find((entry) => entry.userId === args.userId);
    const cutoff = userLastSeen?.timestamp ?? 0;

    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return unreadMessages.filter(
      (msg) => msg.senderId !== args.userId && msg.createdAt > cutoff
    ).length;
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

export const markMessagesAsSeen = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      if (msg.senderId !== args.userId && !msg.seenBy.includes(args.userId)) {
        await ctx.db.patch(msg._id, {
          seenBy: [...msg.seenBy, args.userId],
        });
      }
    }
  },
});

export const deleteForMe = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    if (!message.deletedFor.includes(args.userId)) {
      await ctx.db.patch(args.messageId, {
        deletedFor: [...message.deletedFor, args.userId],
      });
    }
  },
});

export const deleteForEveryone = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId !== args.userId) return;

    await ctx.db.patch(args.messageId, {
      content: "This message was deleted",
      deletedForEveryone: true,
    });
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const allowedEmojis = new Set([
      "\u{1F44D}",
      "\u2764\uFE0F",
      "\u{1F602}",
      "\u{1F62E}",
      "\u{1F622}",
    ]);
    if (!allowedEmojis.has(args.emoji)) return;

    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const reactions = message.reactions || [];
    const existingIndex = reactions.findIndex(
      (r) => r.userId === args.userId && r.emoji === args.emoji
    );

    if (existingIndex !== -1) {
      reactions.splice(existingIndex, 1);
      await ctx.db.patch(args.messageId, { reactions });
      return;
    }

    const filtered = reactions.filter((r) => r.userId !== args.userId);
    filtered.push({ userId: args.userId, emoji: args.emoji });
    await ctx.db.patch(args.messageId, { reactions: filtered });
  },
});


