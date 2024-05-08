import { NextResponse } from "next/server";
import IntractUsers from '@public/intractusers.json';
import { ec, hash, num } from "starknet";
import {Connection} from 'postgresql-client';

export const revalidate = 3600; // 1 hr
export async function GET(req: Request) {
    const connection = new Connection(process.env.DATABASE_URL);
    await connection.connect();

    const result = await connection.query(
        `SELECT COUNT(*) FROM (SELECT DISTINCT claimee FROM claims) AS temp`);
    
    if(result.rows) {
        const rows: any[] = result.rows;
        console.log('rows stats', rows);
        return NextResponse.json({
            totalParticipants: rows[0][0],
        })
    } else {
        return NextResponse.json({
            totalParticipants: 0,
        })
    }
}