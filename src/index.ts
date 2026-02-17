import express, { Request, Response } from "express";
import { handleToolCall } from "./toolRouter.js";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Root route
app.get("/", (req: Request, res: Response) => {
  console.log("ROOT HIT");
  res.send("Server is running");
});

// Chat route
app.post("/chat", async (req: Request, res: Response) => {
  try {
    console.log("CHAT REQUEST RECEIVED");
    console.log("Raw req.body:", req.body);

    // Accept either "prompt" or "query"
    const { prompt, query } = req.body as { prompt?: string; query?: string };
    const userPrompt = prompt || query;

    if (!userPrompt) {
      console.log("No prompt received");
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("User Prompt:", userPrompt);

    // STEP 1 — Check MCP Tool Router
    const toolResponse = await handleToolCall(userPrompt);

    if (toolResponse) {
      console.log("Tool executed instead of LLM");
      console.log("Tool response:", toolResponse);
      return res.json({ reply: toolResponse, source: "tool" });
    }

    console.log("No tool matched — calling LLM");

    // STEP 2 — Call Ollama LLM
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        prompt: userPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP error: ${response.status}`);
    }

    const data = await response.json();

    console.log("LLM response received:", data.response);

    res.json({
      reply: data.response,
      source: "llm",
    });
  } catch (error) {
    console.error("ERROR in /chat:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Bind explicitly to IPv4
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
