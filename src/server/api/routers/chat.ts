import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";
import { messages, users, conversations, friends } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm/expressions";
import { asc, desc } from 'drizzle-orm';

interface FriendOrSenderDetails {
  id: string;
  name: string;
  email: string;
  appID: string;
}

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

      if (!sender) {
        throw new Error("Invalid sender or receiver ID");
      }

      if (!receiver) {
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

      const friendsList: FriendOrSenderDetails[] = (
        await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            appID: users.appID,
          })
          .from(friends)
          .where(eq(friends.userId, userId))
          .innerJoin(users, eq(friends.friendAppID, users.appID))
      ).map((friend) => ({
        ...friend,
        appID: friend.appID ?? "",
      }));

      const receivedMessages: FriendOrSenderDetails[] = (
        await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            appID: users.appID,
          })
          .from(messages)
          .where(eq(messages.receiverId, userId))
          .innerJoin(users, eq(messages.senderId, users.id))
      ).map((msg) => ({
        ...msg,
        appID: msg.appID ?? "",
      }));

      const friendsSet = new Map<string, FriendOrSenderDetails>();

      friendsList.forEach((friend) => {
        friendsSet.set(friend.id, friend);
      });

      receivedMessages.forEach((msg) => {
        if (!friendsSet.has(msg.id)) {
          friendsSet.set(msg.id, msg);
        }
      });

      const uniqueFriendsAndSenders = Array.from(friendsSet.values());

      return uniqueFriendsAndSenders;
    }),
  getLastMessage: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        friendId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const { userId, friendId } = input;

      const lastMessage = await db
        .select({
          id: messages.id,
          content: messages.content,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, userId),
              eq(messages.receiverId, friendId),
            ),
            and(
              eq(messages.senderId, friendId),
              eq(messages.receiverId, userId),
            ),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);

      if (lastMessage.length === 0) {
        return { message: "No messages found" };
      }

    const message = lastMessage[0]!;
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      createdAt: message.createdAt,
    };
    }),
});
