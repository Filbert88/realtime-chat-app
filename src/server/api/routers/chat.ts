import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";
import { messages, users, conversations, friends } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm/expressions";
import { asc, desc, count, sql } from "drizzle-orm";

interface FriendsDetail {
  id: string;
  name: string;
  email: string;
  appID: string | null;
  image: string | null;
  unreadCount: number;
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

      const friendsList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          appID: users.appID,
          image: users.image,
        })
        .from(users)
        .innerJoin(friends, eq(friends.friendAppID, users.appID))
        .where(eq(friends.userId, userId))
        .execute();

      const friendIds = friendsList.map((friend) => friend.id);

      const receivedMessages = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          appID: users.appID,
          image: users.image,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.receiverId, userId))
        .execute();

      const filteredMessages = receivedMessages.filter(
        (msg) => !friendIds.includes(msg.id),
      );

      const combinedUsers = [...friendsList, ...filteredMessages];
      const usersMap = new Map(combinedUsers.map((user) => [user.id, user]));

      const detailedFriends = await Promise.all(
        Array.from(usersMap.values()).map(async (user) => {
          const unreadCountResults = await db
            .select({ count: count() })
            .from(messages)
            .where(
              and(
                eq(messages.receiverId, userId),
                eq(messages.senderId, user.id),
                eq(messages.read, false),
              ),
            )
            .execute();

          const unreadCount = unreadCountResults?.[0]?.count ?? 0;

          return {
            ...user,
            unreadCount: unreadCount,
          };
        }),
      );

      return detailedFriends;
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

  updateMessagesAsRead: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        friendId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, friendId } = input;
      console.log(
        "Updating messages as read with User ID:",
        userId,
        " and Friend ID:",
        friendId,
      );

      try {
        await db
          .update(messages)
          .set({ read: true, updatedAt: sql`CURRENT_TIMESTAMP` })
          .where(
            and(
              eq(messages.receiverId, userId),
              eq(messages.senderId, friendId),
              eq(messages.read, false),
            ),
          )
          .execute();

        const updatedMessages = await db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.receiverId, userId),
              eq(messages.senderId, friendId),
              eq(messages.read, true),
            ),
          )
          .execute();

        if (updatedMessages.length === 0) {
          throw new Error(
            "Failed to mark messages as read or no messages were updated",
          );
        }

        const sanitizedMessages = updatedMessages.map((message) => ({
          ...message,
          createdAt: message.createdAt
            ? new Date(message.createdAt).toISOString()
            : null,
          updatedAt: message.updatedAt
            ? new Date(message.updatedAt).toISOString()
            : null,
        }));

        return { sanitizedMessages };
      } catch (error) {
        console.error("Error during update operation:", error);
        throw new Error("Failed to update messages as read due to an error");
      }
    }),

    deleteMessage: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        messageId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, messageId } = input;
      console.log("Deleting message with Message ID:", messageId, " for User ID:", userId);
    
      try {
        const updateResult = await db
          .update(messages)
          .set({
            deletedByUserId: userId, 
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(
            and(
              eq(messages.id, messageId),
              or(
                eq(messages.receiverId, userId),
                eq(messages.senderId, userId)
              )
            ),
          )
          .execute();
    
        if (!updateResult) {
          throw new Error("Failed to delete the message.");
        }
    
        const updatedMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.id, messageId))
          .execute();
  
        if (updatedMessage.length === 0) {
          throw new Error("Failed to update the message or no messages were updated");
        }

        console.log(updatedMessage);
  
        const sanitizedMessage = updatedMessage.map((message) => ({
          ...message,
          createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : null,
          updatedAt: message.updatedAt ? new Date(message.updatedAt).toISOString() : null,
        }));
        
        return { sanitizedMessage };
      } catch (error) {
        console.error("Error during update operation:", error);
        throw new Error("Failed to delete message due to an error");
      }
    }),  
  
  unsendMessage: publicProcedure
    .input(
      z.object({
        messageId: z.number(),
        userId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { messageId, userId } = input;

      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .then((results) => results[0]);

      if (!message || message.senderId !== userId) {
        throw new Error("Message not found or user is not the sender.");
      }

      const deleted = await db
        .delete(messages)
        .where(eq(messages.id, messageId))
        .execute();

      if (!deleted) {
        throw new Error("Failed to unsend the message.");
      }

      return { message: "Message unsent successfully" };
    }),
});
