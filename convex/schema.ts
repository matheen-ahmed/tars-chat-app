import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
    online: v.boolean(),
    lastActiveAt: v.optional(v.number()),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    conversationKey: v.string(),
    participantA: v.id("users"),
    participantB: v.id("users"),
    participants: v.array(v.id("users")),
    lastMessage: v.optional(v.string()),
    lastMessageTime: v.optional(v.number()),
    lastSeen: v.array(
      v.object({
        userId: v.id("users"),
        timestamp: v.number(),
      })
    ),
    typing: v.optional(
      v.object({
        userId: v.id("users"),
        isTyping: v.boolean(),
        updatedAt: v.number(),
      })
    ),
  })
    .index("by_conversationKey", ["conversationKey"])
    .index("by_participantA", ["participantA"])
    .index("by_participantB", ["participantB"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    seenBy: v.array(v.id("users")),
  }).index("by_conversation", ["conversationId"]),
});
