import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	email: varchar("email", { length: 256 }).unique().notNull(),
	hashedPassword: varchar("hashed_password", { length: 256 }).notNull(),
});

export const chirps = pgTable("chirps", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	userId: varchar("user_id", { length: 256 }),
	body: varchar("body", { length: 256 }),
});

export type NewUser = typeof users.$inferInsert;
export type NewChirp = typeof chirps.$inferInsert;
