import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        image: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
        online: v.boolean(),
        lastActiveAt: v.optional(v.number()),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        participants: v.array(v.id("users")),
        isGroup: v.optional(v.boolean()),
        groupName: v.optional(v.string()),
        createdBy: v.optional(v.id("users")),
        lastMessage: v.optional(v.string()),
        lastMessageTime: v.optional(v.number()),
        lastSeen: v.optional(
            v.array(
                v.object({
                    userId: v.id("users"),
                    timestamp: v.number(),
                })
            )
        ),
        typing: v.optional(
            v.object({
                userId: v.id("users"),
                isTyping: v.boolean(),
                updatedAt: v.number(),
            })
        ),
    }),

    messages: defineTable({
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
        createdAt: v.number(),
        seenBy: v.array(v.id("users")),
        deletedFor: v.array(v.id("users")),
        deletedForEveryone: v.boolean(),
        pinnedBy: v.optional(v.array(v.id("users"))),
        starredBy: v.optional(v.array(v.id("users"))),
        reactions: v.optional(
            v.array(
                v.object({
                    userId: v.id("users"),
                    emoji: v.string(),
                })
            )
        ),
    }).index("by_conversation", ["conversationId"]),
});
