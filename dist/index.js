import express from "express";
import { handleToolCall2 } from "./toolRouter.js";
const app = express();
const PORT = 3000;
// Middleware
app.use(express.json());
// Root route
app.get("/", (req, res) => {
    console.log("ROOT HIT");
    res.send("Server is running");
});
// Chat route
app.post("/chat", async (req, res) => {
    try {
        console.log("CHAT REQUEST RECEIVED");
        console.log("Raw req.body:", req.body);
        // Accept either "prompt" or "query"
        const { prompt, query } = req.body;
        const userPrompt = prompt || query;
        if (!userPrompt) {
            console.log("No prompt received");
            return res.status(400).json({ error: "Prompt is required" });
        }
        console.log("User Prompt:", userPrompt);
        const sqlPrompt = `
You are a SQL assistant for PostgreSQL.

Database schema (use only these tables and columns):
1) branches
- branch_id (serial, primary key)
- branch_name (text)
- city (text)
- ifsc (text)

2) customers
- customer_id (serial, primary key)
- name (text)
- date_of_birth (date)
- gender (text)
- email (text)
- phone (text)
- start_date (date)

3) accounts
- account_id (serial, primary key)
- customer_id (int, fk -> customers.customer_id)
- branch_id (int, fk -> branches.branch_id)
- account_type (text)
- balance (numeric)
- open_date (date)
- status (text)

4) loans
- loan_id (serial, primary key)
- customer_id (int, fk -> customers.customer_id)
- account_id (int, fk -> accounts.account_id)
- loan_type (text)
- principle (numeric)
- interest (numeric)
- term_months (int)
- status (text)
- start_date (date)
- end_date (date)

5) transactions
- transaction_id (serial, primary key)
- account_id (int, fk -> accounts.account_id)
- transaction_date (date)
- transaction_type (text)
- amount (numeric)
- channel (text)
- status (text)
- start_date (date)
- end_date (date)

Client request: "${userPrompt}"

Rules:
- Return exactly one valid PostgreSQL SELECT query only.
- No markdown, no explanation, no comments.
- You may use joins, aggregations (COUNT/SUM/AVG/MIN/MAX), GROUP BY, HAVING, ORDER BY, CTEs, window functions, and arithmetic expressions.
- Use only the five listed tables.
- Use exact column names from this schema.
- Do NOT invent tables (e.g., phone_numbers). There is no phone_numbers table.
- Customer phone data is stored only in customers.phone.
`.trim();
        // STEP 1 — Check MCP Tool Router
        // STEP 2 — Call Ollama LLM
        const response = await fetch("http://127.0.0.1:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama3:8b",
                prompt: sqlPrompt,
                stream: false,
            }),
        });
        if (!response.ok) {
            throw new Error(`Ollama HTTP error: ${response.status}`);
        }
        const data = await response.json();
        console.log("LLM response received:", data.response);
        const toolResponse = await handleToolCall2(data.response);
        if (toolResponse) {
            console.log("Tool executed instead of LLM");
            console.log("Tool response:", toolResponse);
            return res.json({ reply: toolResponse, source: "tool" });
        }
        console.log("No tool matched — calling LLM");
        return res.json({
            reply: data.response,
            source: "llm",
        });
    }
    catch (error) {
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
