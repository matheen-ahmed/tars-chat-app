import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

type TableName = "users" | "conversations" | "messages";
const tableNameValidator = v.union(
  v.literal("users"),
  v.literal("conversations"),
  v.literal("messages"),
);

async function requireAdmin(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const adminClerkId = process.env.ADMIN_CLERK_ID;
  if (!adminClerkId || identity.subject !== adminClerkId) {
    throw new Error("Forbidden");
  }
}

export const cleanupCoreTables = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    let usersUpdated = 0;
    let conversationsUpdated = 0;
    let messagesUpdated = 0;

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.replace(user._id, {
        clerkId: user.clerkId,
        name: user.name || "User",
        email: user.email || "",
        image: user.image || "",
        online: Boolean(user.online),
        lastActiveAt:
          typeof user.lastActiveAt === "number" ? user.lastActiveAt : undefined,
      });
      usersUpdated += 1;
    }

    const conversations = await ctx.db.query("conversations").collect();
    for (const conversation of conversations) {
      const participants = normalizeParticipants(conversation.participants);
      const [participantA, participantB] = participants;

      const lastSeen =
        conversation.lastSeen.length > 0
          ? conversation.lastSeen
              .filter((entry) => entry?.userId && Number.isFinite(entry.timestamp))
              .map((entry) => ({
                userId: entry.userId,
                timestamp: entry.timestamp,
              }))
          : [
              { userId: participantA, timestamp: 0 },
              { userId: participantB, timestamp: 0 },
            ];

      const typing =
        conversation.typing &&
        Number.isFinite(conversation.typing.updatedAt) &&
        typeof conversation.typing.isTyping === "boolean" &&
        conversation.typing.userId
          ? {
              userId: conversation.typing.userId,
              isTyping: conversation.typing.isTyping,
              updatedAt: conversation.typing.updatedAt,
            }
          : undefined;

      await ctx.db.replace(conversation._id, {
        conversationKey:
          conversation.conversationKey ||
          `${String(participantA)}:${String(participantB)}`,
        participantA: conversation.participantA ?? participantA,
        participantB: conversation.participantB ?? participantB,
        participants,
        lastMessage:
          typeof conversation.lastMessage === "string"
            ? conversation.lastMessage
            : undefined,
        lastMessageTime:
          typeof conversation.lastMessageTime === "number"
            ? conversation.lastMessageTime
            : undefined,
        lastSeen,
        typing,
      });
      conversationsUpdated += 1;
    }

    const messages = await ctx.db.query("messages").collect();
    for (const message of messages) {
      await ctx.db.replace(message._id, {
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: String(message.content ?? "").trim(),
        createdAt:
          typeof message.createdAt === "number"
            ? message.createdAt
            : Date.now(),
        seenBy:
          Array.isArray(message.seenBy) && message.seenBy.length > 0
            ? message.seenBy
            : [message.senderId],
      });
      messagesUpdated += 1;
    }

    return { usersUpdated, conversationsUpdated, messagesUpdated };
  },
});

function normalizeParticipants(
  participants: Array<Id<"users">>,
): [Id<"users">, Id<"users">] {
  const deduped = Array.from(new Set(participants.filter(Boolean)));
  const [first, second] = deduped;
  if (!first || !second) {
    throw new Error("Conversation has invalid participants");
  }
  return String(first) < String(second) ? [first, second] : [second, first];
}

async function getDocs(ctx: MutationCtx, tableName: TableName) {
  if (tableName === "users") return await ctx.db.query("users").collect();
  if (tableName === "conversations") {
    return await ctx.db.query("conversations").collect();
  }
  return await ctx.db.query("messages").collect();
}

export const clearTables = mutation({
  args: { tableNames: v.array(tableNameValidator) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const result: Array<{ table: TableName; deleted: number }> = [];
    for (const tableName of args.tableNames) {
      const docs = await getDocs(ctx, tableName);
      for (const doc of docs as Array<Doc<TableName>>) {
        await ctx.db.delete(doc._id);
      }
      result.push({ table: tableName, deleted: docs.length });
    }
    return result;
  },
});
