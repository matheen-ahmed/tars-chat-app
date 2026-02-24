import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_WINDOW_MS = 30_000;

// Create user if not exists
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        image: args.image ?? "",
        online: true,
        lastActiveAt: Date.now(),
      });
    } else {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        image:
          existing.imageStorageId || !args.image
            ? existing.image
            : args.image,
        online: true,
        lastActiveAt: Date.now(),
      });
    }

    return true;
  },
});

// Get all users except current
export const getUsers = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!currentUser) return [];

    const users = await ctx.db.query("users").collect();

    const now = Date.now();
    const filtered = users.filter((user) => user._id !== currentUser._id);
    return Promise.all(
      filtered.map(async (profile) => ({
        ...profile,
        image:
          profile.imageStorageId
            ? (await ctx.storage.getUrl(profile.imageStorageId)) ?? profile.image
            : profile.image,
        online:
          profile.online &&
          !!profile.lastActiveAt &&
          now - profile.lastActiveAt < ONLINE_WINDOW_MS,
      }))
    );
  },
});

export const getCurrentUser = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();
    if (!user) return null;
    return {
      ...user,
      image:
        user.imageStorageId
          ? (await ctx.storage.getUrl(user.imageStorageId)) ?? user.image
          : user.image,
    };
  },
});

export const generateProfileUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateProfileImage = mutation({
  args: {
    clerkId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return false;

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) return false;

    await ctx.db.patch(user._id, {
      imageStorageId: args.storageId,
      image: imageUrl,
    });
    return true;
  },
});

export const setOnlineStatus = mutation({
  args: {
    clerkId: v.string(),
    online: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, {
      online: args.online,
      lastActiveAt: Date.now(),
    });
  },
});

export const heartbeat = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, {
      online: true,
      lastActiveAt: Date.now(),
    });
  },
});
