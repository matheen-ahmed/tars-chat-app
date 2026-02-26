import { mutation } from "./_generated/server";
import { v } from "convex/values";

type AnyDoc = { _id: string; [key: string]: any };

export const cleanupCoreTables = mutation({
  args: {},
  handler: async (ctx) => {
    let usersUpdated = 0;
    let conversationsUpdated = 0;
    let messagesUpdated = 0;

    const users = (await ctx.db.query("users").collect()) as AnyDoc[];
    for (const user of users) {
      await ctx.db.replace(user._id as any, {
        clerkId: String(user.clerkId ?? ""),
        name: String(user.name ?? "User"),
        email: String(user.email ?? ""),
        image: String(user.image ?? ""),
        online: Boolean(user.online),
        lastActiveAt:
          typeof user.lastActiveAt === "number" ? user.lastActiveAt : undefined,
      } as any);
      usersUpdated += 1;
    }

    const conversations = (await ctx.db.query("conversations").collect()) as AnyDoc[];
    for (const conversation of conversations) {
      const participants = Array.isArray(conversation.participants)
        ? conversation.participants
        : [];
      const lastSeen = Array.isArray(conversation.lastSeen)
        ? conversation.lastSeen.filter(
            (entry: any) =>
              entry &&
              typeof entry.timestamp === "number" &&
              !!entry.userId,
          )
        : participants.map((userId: any) => ({ userId, timestamp: 0 }));
      const typing =
        conversation.typing &&
        typeof conversation.typing.updatedAt === "number" &&
        typeof conversation.typing.isTyping === "boolean" &&
        !!conversation.typing.userId
          ? {
              userId: conversation.typing.userId,
              isTyping: conversation.typing.isTyping,
              updatedAt: conversation.typing.updatedAt,
            }
          : undefined;

      await ctx.db.replace(conversation._id as any, {
        conversationKey:
          typeof conversation.conversationKey === "string"
            ? conversation.conversationKey
            : undefined,
        participantA: conversation.participantA,
        participantB: conversation.participantB,
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
      } as any);
      conversationsUpdated += 1;
    }

    const messages = (await ctx.db.query("messages").collect()) as AnyDoc[];
    for (const message of messages) {
      await ctx.db.replace(message._id as any, {
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: String(message.content ?? ""),
        createdAt:
          typeof message.createdAt === "number"
            ? message.createdAt
            : Date.now(),
        seenBy: Array.isArray(message.seenBy) ? message.seenBy : [],
      } as any);
      messagesUpdated += 1;
    }

    return { usersUpdated, conversationsUpdated, messagesUpdated };
  },
});

export const clearTables = mutation({
  args: { tableNames: v.array(v.string()) },
  handler: async (ctx, args) => {
    const result: Array<{ table: string; deleted: number }> = [];
    for (const tableName of args.tableNames) {
      const docs = await (ctx.db as any).query(tableName).collect();
      for (const doc of docs) {
        await (ctx.db as any).delete(doc._id);
      }
      result.push({ table: tableName, deleted: docs.length });
    }
    return result;
  },
});
