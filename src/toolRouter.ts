import { pool } from "./db.js"; // your db.ts

export async function handleToolCall(prompt: string) {
  console.log("handleToolCall received:", prompt);

  const lowerPrompt = prompt.toLowerCase();

  // Example: Match prompts about customers
  if (lowerPrompt.includes("show all customers") || lowerPrompt.includes("list customers")) {
    let client;
    try {
      client = await pool.connect();

      // Query your customers table
      const result = await client.query<{ name: string; email: string }>(
        "SELECT full_name AS name, email FROM customers ORDER BY customer_id",
      );

      if (result.rows.length === 0) {
        return "No customers found in the database.";
      }

      // Format the result nicely
      const formatted = result.rows
        .map((row, i) => `${i + 1}. ${row.name} (${row.email})`)
        .join("\n");

      return `Customer List:\n${formatted}`;
    } catch (err) {
      console.error("DB Error in handleToolCall:", err);
      return "Failed to fetch customer data.";
    } finally {
      client?.release();
    }
  }

  // If no tool matches, return null so LLM is called
  return null;
}
