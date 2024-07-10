import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";
import { users, friends } from "@/server/db/schema";
import { eq } from "drizzle-orm/expressions";

export const friendRouter = createTRPCRouter({
  addFriend: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        friendAppID: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, friendAppID } = input;

      if (!userId) {
        throw new Error("User ID is invalid");
      }

      if (!friendAppID) {
        throw new Error("Friend ID is invalid");
      }

      const [friend] = await db
        .select()
        .from(users)
        .where(eq(users.appID, friendAppID));

      if (!friend) {
        throw new Error("Friend not found");
      }

      await db.insert(friends).values({
        userId: userId as string,
        friendAppID: friend.appID as string,
      });

      return { message: "Friend added successfully" };
    }),
  getFriends: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { userId } = input;

      const userFriends = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          appID: users.appID,
        })
        .from(users)
        .innerJoin(friends, eq(friends.friendAppID, users.appID))
        .where(eq(friends.userId, userId));

      return userFriends;
    }),
});
