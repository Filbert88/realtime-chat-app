import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm/expressions";

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
        .select({ name: users.name, appID : users.appID })
        .from(users)
        .where(eq(users.id, id));

      if (!user) {
        throw new Error("User not found");
      }

      return { name: user.name, appID: user.appID };
    }),
});
