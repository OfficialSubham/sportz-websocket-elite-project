import { Router } from "express";
import { matchIdParamSchema } from "../validations/matches.js";
import {
    createCommentarySchema,
    listCommentaryQuerySchema,
} from "../validations/commentary.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
    const { id } = req.params;
    const matchIdValidation = matchIdParamSchema.safeParse(id);

    if (!matchIdValidation.success)
        return res.status(400).json({ error: "Please Enter a valid match id" });

    const commentaryLimit = listCommentaryQuerySchema.safeParse(req.query);

    if (!commentaryLimit.success)
        return res.status(400).json({ error: "Please enter a valid commentary limit" });

    try {
        const result = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchIdValidation.data))
            .orderBy(desc(commentary.createdAt))
            .limit(commentaryLimit.data.limit);

        res.json({ message: "Commentary List", data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Falied to retrive commentary data" });
    }
});

commentaryRouter.post("/", async (req, res) => {
    const { id } = req.params;
    const matchIdValidation = matchIdParamSchema.safeParse(id);
    if (!matchIdValidation.success)
        return res.status(400).json({ error: "Please Enter a valid match Id" });

    const commentaryDataValidation = createCommentarySchema.safeParse(req.body);

    if (!commentaryDataValidation.success)
        return res.status(400).json({ error: "Please enter valid commentary details" });

    try {
        const [result] = await db
            .insert(commentary)
            .values({
                matchId: matchIdValidation.data,
                ...commentaryDataValidation.data,
            })
            .returning();
        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(result.matchId, result);
        }
        res.status(201).json({ message: "Commentary added", data: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create commentary" });
    }
});
