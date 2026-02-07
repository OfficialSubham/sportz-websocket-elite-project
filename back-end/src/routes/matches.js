import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validations/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { desc } from "drizzle-orm";

export const matchesRoute = Router();

const MAX_LIMIT = 100;

matchesRoute.get("/", async (req, res) => {
    const { success, data } = listMatchesQuerySchema.safeParse(req.query);

    if (!success) return res.status(400).json({ error: "INVALID_REQUEST" });

    const limit = Math.min(data.limit ?? 50, MAX_LIMIT);

    try {
        const matchData = await db
            .select()
            .from(matches)
            .orderBy(desc(matches.createdAt))
            .limit(limit);

        res.json({ data: matchData });
    } catch (error) {
        res.status(500).json({ error: "Failed to list match" });
    }
});

matchesRoute.post("/", async (req, res) => {
    const { success, data } = createMatchSchema.safeParse(req.body);

    if (!success) return res.status(400).json({ error: "INVALID_REQUEST" });

    const { startTime, endTime } = data;

    try {
        const [event] = await db
            .insert(matches)
            .values({
                ...data,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            })
            .returning();

        res.status(201).json({ data: event });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create a match" });
    }
});
