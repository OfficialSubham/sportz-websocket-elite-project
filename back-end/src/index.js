import express from "express";
import { matchesRoute } from "./routes/matches.js";

const app = express();

const PORT = 8000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Working" });
});

app.use("/matches", matchesRoute);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
