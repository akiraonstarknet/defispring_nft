import { NextResponse } from "next/server";
import IntractUsers from '@public/intractusers.json';
import { ec, hash, num } from "starknet";
import {Connection} from 'postgresql-client';
import { getConnection } from "../utils";

export const revalidate = 3600; // 1 hr
export async function GET(req: Request) {
    let connection: Connection | null = null;

    try {
        connection = await getConnection();

        const result = await connection.query(
            `SELECT COUNT(*) FROM (SELECT DISTINCT claimee FROM claims) AS temp`);
        
        if(result.rows) {
            const rows: any[] = result.rows;
            console.log('rows stats', rows);
            connection.close();
            return NextResponse.json({
                totalParticipants: rows[0][0],
                tvl: '288.43m'
            })
        } else {
            connection.close();
            return NextResponse.json({
                totalParticipants: 0,
                tvl: '288.43m'
            })
        }
    } catch(err) {
        console.error('Error /api/stats', err);
        if (connection)
            connection.close();
        return NextResponse.json({
            totalParticipants: 0,
            tvl: '0'
        })
    }
}