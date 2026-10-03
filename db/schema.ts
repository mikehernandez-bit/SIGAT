// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"),
  profile: text("profile").notNull().default("{}"),
  created: text("created").notNull(),
});
export const requests = sqliteTable(
  "requests",
  {
    serial: integer("serial").primaryKey({ autoIncrement: true }),
    id: text("id").notNull().unique(),
    code: text("code").unique(),
    owner: text("owner")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    status: text("status").notNull().default("draft"),
    office: text("office").notNull(),
    response: text("response").notNull().default(""),
    revision: integer("revision").notNull().default(1),
    lastOp: text("last_op").notNull(),
    created: text("created").notNull(),
    updated: text("updated").notNull(),
    submitted: text("submitted"),
  },
  (t) => [
    index("requests_owner_idx").on(t.owner),
    index("requests_status_idx").on(t.status),
  ],
);
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    request: text("request")
      .notNull()
      .references(() => requests.id),
    status: text("status").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    actor: text("actor").notNull(),
    snapshot: text("snapshot"),
    created: text("created").notNull(),
  },
  (t) => [index("events_request_idx").on(t.request)],
);
export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey(),
    request: text("request")
      .notNull()
      .references(() => requests.id),
    name: text("name").notNull(),
    key: text("object_key").notNull().unique(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    kind: text("kind").notNull(),
    retired: integer("retired").notNull().default(0),
    created: text("created").notNull(),
  },
  (t) => [index("files_request_idx").on(t.request)],
);
export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    owner: text("owner")
      .notNull()
      .references(() => users.id),
    request: text("request")
      .notNull()
      .references(() => requests.id),
    message: text("message").notNull(),
    read: integer("read").notNull().default(0),
    created: text("created").notNull(),
  },
  (t) => [index("notifications_owner_idx").on(t.owner)],
);
// Perfiles de demostración aislados por la identidad real que accede al sitio privado.
export const simulatedAccounts = sqliteTable("simulated_accounts", {
  id: text("id").primaryKey().references(() => users.id),
  gateOwner: text("gate_owner").notNull().references(() => users.id),
  email: text("email").notNull(),
  kind: text("kind").notNull(),
}, t => [uniqueIndex("simulated_accounts_owner_email_idx").on(t.gateOwner, t.email)]);
export const simulationSessions = sqliteTable("simulation_sessions", {
  gateOwner: text("gate_owner").primaryKey().references(() => users.id),
  actor: text("actor").notNull().references(() => simulatedAccounts.id),
  updated: text("updated").notNull(),
});
