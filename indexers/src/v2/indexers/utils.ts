import dotenv from "dotenv";
dotenv.config();
import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import pg from 'pg';
import * as schema from './drizzle/schema';
import { num } from "starknet";

export async function autoRetry(cb: any, args: any, MAX_RETRIES = 10) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            return await cb(...args);
        } catch (e) {
            console.error(e);
            retries++;
        }
    }
    throw new Error("Max retries reached");
}

export function getDB(connectionString: string) {
    const pool = new pg.Pool({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: true // Set to true if you have a valid CA certificate
        }
    });
    // Set statement timeout for queries
    pool.on('connect', (client) => {
        client.query('SET statement_timeout TO 60000'); // Timeout in milliseconds
    });
    return drizzle(pool, { schema });
}

export function standardise(address: string | bigint) {
    let _a = address;
    if (!address) {
        _a = "0";
    }
    const a = num.getHexString(num.getDecimalString(_a.toString()));
    return a;
}

export function toHex(el: string | null | undefined) {
    if (!el) return '0x0'
    return standardise(el);
}