import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";
import { messages, users, conversations, friends } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm/expressions";

export const chatRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(
      z.object({
        senderId: z.string().uuid(),
        receiverId: z.string().uuid(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { senderId, receiverId, content } = input;

      const [sender] = await db
        .select()
        .from(users)
        .where(eq(users.id, senderId));
      const [receiver] = await db
        .select()
        .from(users)
        .where(eq(users.id, receiverId));

      if (!sender || !receiver) {
        throw new Error("Invalid sender or receiver ID");
      }

      let conversation = await db
        .select()
        .from(conversations)
        .where(
          or(
            and(
              eq(conversations.participant1Id, senderId),
              eq(conversations.participant2Id, receiverId),
            ),
            and(
              eq(conversations.participant1Id, receiverId),
              eq(conversations.participant2Id, senderId),
            ),
          ),
        )
        .then((results) => results[0]);

      if (!conversation) {
        [conversation] = await db
          .insert(conversations)
          .values({ participant1Id: senderId, participant2Id: receiverId })
          .returning();
      }

      if (!conversation) {
        throw new Error("Failed to create a new conversation");
      }

      await db.insert(messages).values({
        senderId,
        receiverId,
        content,
        conversationId: conversation.id,
      });

      return { message: "Message sent successfully" };
    }),

  getMessages: publicProcedure
    .input(
      z.object({
        senderId: z.string().uuid(),
        receiverId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { senderId, receiverId } = input;

      const chatMessages = await db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, senderId),
              eq(messages.receiverId, receiverId),
            ),
            and(
              eq(messages.senderId, receiverId),
              eq(messages.receiverId, senderId),
            ),
          ),
        )
        .orderBy(messages.createdAt);

      return chatMessages;
    }),

    getFriendsAndConversations: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { userId } = input;
  
      const friendsList = await db
        .select({
          user: users,
          friendDetails: users
        })
        .from(friends)
        .where(eq(friends.userId, userId))
        .innerJoin(users, eq(friends.friendAppID, users.appID))
        .execute();
  
      const receivedMessages = await db
        .select({
          user: users,
          senderDetails: users
        })
        .from(messages)
        .where(eq(messages.receiverId, userId))
        .innerJoin(users, eq(messages.senderId, users.id))
        .execute();
  
      // Merge friendsList and uniqueSenders, ensuring no duplicates
      const friendsSet = new Map();
  
      friendsList.forEach((friend) => {
        friendsSet.set(friend.friendDetails.id, friend.friendDetails);
      });
  
      receivedMessages.forEach((msg) => {
        if (!friendsSet.has(msg.senderDetails.id)) {
          friendsSet.set(msg.senderDetails.id, msg.senderDetails);
        }
      });
  
      const uniqueFriendsAndSenders = Array.from(friendsSet.values());
  
      return uniqueFriendsAndSenders;
    }),
  


});
