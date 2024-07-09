import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";
import { eq } from "drizzle-orm/expressions";
import { users } from "@/server/db/schema";
import { hashPassword } from "utils";
import { sql } from "drizzle-orm";

export const signupRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        phone: z.string().min(10),
      }),
    )
    .mutation(async ({ input }) => {
      const { email, password, name, phone } = input;
      console.log("Signup attempt:", input);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .execute();

      if (existingUser.length > 0) {
        throw new Error("User with this email already exists");
      }

      const existingUserByPhone = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .execute();

      if (existingUserByPhone.length > 0) {
        throw new Error("User with this phone number already exists");
      }

      const hashedPassword = await hashPassword(password);

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
          phone,
        })
        .returning()
        .execute();

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      return { id: newUser.id, email: newUser.email, name: newUser.name };
    }),

    addId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        appID: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, appID } = input;

      try {
        const updatedUser = await db
          .update(users)
          .set({
            appID: appID,
            updatedAt: sql`CURRENT_TIMESTAMP`,  
          })
          .where(eq(users.id, userId))
          .returning()
          .execute();

        console.log("Updated user:", updatedUser);

        if (updatedUser.length === 0) {
          throw new Error("Failed to update user with appID");
        }

        // Sanitize dates
        const sanitizedUser = updatedUser.map(user => ({
          ...user,
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
          updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
          emailVerified: user.emailVerified ? new Date(user.emailVerified).toISOString() : null,
        }));

        console.log("Sanitized user:", sanitizedUser);

        return { success: true, userId: userId, appID: appID, sanitizedUser };
      } catch (error) {
        console.error("Error during update operation:", error);
        throw new Error("Failed to update user with appID");
      }
    }),
});
