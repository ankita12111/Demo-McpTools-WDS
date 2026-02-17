import { Pool } from "pg";
export const pool = new Pool({
    user: "postgres",
    host: "127.0.0.1",
    database: "INM_BANK",
    password: "aashu_123",
    port: 5432,
});
