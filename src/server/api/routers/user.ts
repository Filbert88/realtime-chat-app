import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";
import { users,conversations } from "@/server/db/schema";
import { eq } from "drizzle-orm/expressions";
import { and,or } from "drizzle-orm/expressions";

export const userRouter = createTRPCRouter({
  getUser: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { id } = input;

      const [user] = await db
        .select({ name: users.name, appID: users.appID })
        .from(users)
        .where(eq(users.id, id));

      if (!user) {
        throw new Error("User not found");
      }

      return { name: user.name, appID: user.appID };
    }),

  getConversationID: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        friendId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { userId, friendId } = input;

      const [conversation] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          or(
            and(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, friendId),
            ),
            and(
              eq(conversations.participant1Id, friendId),
              eq(conversations.participant2Id, userId),
            ),
          ),
        );

      if (!conversation) {
        throw new Error("No conversation found for these users");
      }

      return { conversationId: conversation.id };
    }),
});
