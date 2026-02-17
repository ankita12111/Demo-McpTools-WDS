import { pool } from "./db.js"; // your db.ts
export async function handleToolCall(prompt) {
    console.log("handleToolCall received:", prompt);
    const lowerPrompt = prompt.toLowerCase();
    const customerIntent = /\b(customers?)\b/.test(lowerPrompt) &&
        /\b(show|list|get|find|display)\b/.test(lowerPrompt);
    const startsWithMatch = lowerPrompt.match(/starts?\s+with\s+([a-z])/i);
    const startsWith = startsWithMatch?.[1];
    // Example: Match prompts about customers
    if (customerIntent) {
        let client;
        try {
            client = await pool.connect();
            const columnsResult = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'customers'
        `);
            const columns = new Set(columnsResult.rows.map((r) => r.column_name));
            const nameColumn = columns.has("full_name")
                ? "full_name"
                : columns.has("first_name")
                    ? "first_name"
                    : columns.has("customer_name")
                        ? "customer_name"
                        : null;
            const emailColumn = columns.has("email") ? "email" : null;
            const orderColumn = columns.has("customer_id")
                ? "customer_id"
                : columns.has("id")
                    ? "id"
                    : nameColumn ?? null;
            if (!nameColumn) {
                return "Could not find a name column in customers table.";
            }
            const params = [];
            let whereClause = "";
            if (startsWith) {
                params.push(`${startsWith}%`);
                whereClause = ` WHERE ${nameColumn} ILIKE $1`;
            }
            const orderByClause = orderColumn ? ` ORDER BY ${orderColumn}` : "";
            const result = await client.query(`SELECT ${nameColumn} AS name, ${emailColumn ? `${emailColumn} AS email` : "NULL::text AS email"} FROM customers${whereClause}${orderByClause}`, params);
            if (result.rows.length === 0) {
                return startsWith
                    ? `No customers found whose name starts with '${startsWith}'.`
                    : "No customers found in the database.";
            }
            // Format the result nicely
            const formatted = result.rows
                .map((row, i) => row.email ? `${i + 1}. ${row.name} (${row.email})` : `${i + 1}. ${row.name}`)
                .join("\n");
            return `Customer List:\n${formatted}`;
        }
        catch (err) {
            console.error("DB Error in handleToolCall:", err);
            return "Failed to fetch customer data.";
        }
        finally {
            client?.release();
        }
    }
    // If no tool matches, return null so LLM is called
    return null;
}
