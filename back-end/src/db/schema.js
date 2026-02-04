import { sql } from "drizzle-orm";
import {
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    check,
} from "drizzle-orm/pg-core";

export const match_status = pgEnum("match_status", ["scheduled", "live", "finished"]);

export const matches = pgTable(
    "matches",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        sport: text("sport", { length: 256 }),
        homeTeam: text("home_team", { length: 256 }),
        awayTeam: text("away_team", { length: 256 }),
        status: match_status("status").notNull().default("scheduled"),
        startTime: timestamp("start_time"),
        endTime: timestamp("end_time"),
        homeScore: integer("home_score").default(0).notNull(),
        awayScore: integer("away_score").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (events) => {
        return {
            checkTimeStanps: check(
                "check_timestamps_valid",
                sql`"start_time" < "end_time" `,
            ),
        };
    },
);

export const commentary = pgTable("commentary", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    matchId: integer("match_id").references(() => matches.id),
    minute: integer("minute"),
    sequence: integer("sequence"),
    period: text("period"),
    eventType: text("event_type"),
    actor: text("actor"),
    team: text("team"),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
