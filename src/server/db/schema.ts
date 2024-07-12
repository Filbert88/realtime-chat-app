import { relations, sql } from "drizzle-orm";
import {
  integer,
  pgTableCreator,
  primaryKey,
  serial,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `rtc_${name}`);

export const users = createTable("user", {
  id: uuid("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => sql`uuid_generate_v4()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  appID: varchar("app_id", { length: 255 }).unique(), 
  image: varchar("image_url", { length: 255 }),
  emailVerified: timestamp("email_verified"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const accounts = createTable("account", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: varchar("refresh_token", { length: 255 }),
  access_token: varchar("access_token", { length: 255 }),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: varchar("id_token", { length: 255 }),
  session_state: varchar("session_state", { length: 255 }),
});

export const messages = createTable("msg", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => users.id),
  conversationId: uuid("conversation_id").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const conversations = createTable("cvs", {
  id: uuid("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => sql`uuid_generate_v4()`),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  participant1Id: uuid("participant1_id")
    .notNull()
    .references(() => users.id),
  participant2Id: uuid("participant2_id")
    .notNull()
    .references(() => users.id),
});

export const participants = createTable(
  "ptp",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    pk: primaryKey(table.conversationId, table.userId),
  }),
);

export const friends = createTable("friends", {
  id: uuid("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => sql`uuid_generate_v4()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  friendAppID: varchar("friend_app_id", { length: 255 }) 
    .notNull()
    .references(() => users.appID),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const sessions = createTable("ssion", {
  sessionToken: varchar("session_token", { length: 255 })
    .notNull()
    .primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = createTable(
  "vrf_t",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    pk: primaryKey(table.identifier, table.token),
  }),
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages),
  receivedMessages: many(messages),
  sessions: many(sessions),
  friends: many(friends, { relationName: "userId" }),
  friendsWithAppID: many(friends, { relationName: "friendAppID" }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users),
  receiver: one(users),
  conversation: one(conversations),
}));

export const conversationsRelations = relations(
  conversations,
  ({ many, one }) => ({
    participants: many(participants),
    participant1: one(users, {
      fields: [conversations.participant1Id],
      references: [users.id],
    }),
    participant2: one(users, {
      fields: [conversations.participant2Id],
      references: [users.id],
    }),
  }),
);

export const participantsRelations = relations(participants, ({ one }) => ({
  user: one(users),
  conversation: one(conversations),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
  }),
  friend: one(users, {
    fields: [friends.friendAppID],
    references: [users.appID], 
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users),
}));

export const verificationTokensRelations = relations(
  verificationTokens,
  ({ one }) => ({
    user: one(users),
  }),
);
