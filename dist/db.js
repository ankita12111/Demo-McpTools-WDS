import { Pool } from "pg";
export const pool = new Pool({
    user: "postgres",
    host: "127.0.0.1",
    database: "INM_BANK",
    password: "3103",
    port: 5432,
});
