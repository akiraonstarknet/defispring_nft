import { NextResponse } from "next/server";
import IntractUsers from '@public/intractusers.json';
import { ec, hash, num } from "starknet";
import {Connection} from 'postgresql-client';

export const revalidate = 3600; // 1 hr
export async function GET(req: Request) {
    let connection: Connection | null = null;

    try {
        connection = new Connection({
            host: process.env.DATABASE_HOSTNAME,
            port: 5432,
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_DB,
            ssl: {
                host: process.env.DATABASE_HOSTNAME,
                port: 5432,
            }
        });
        await connection.connect();

        const result = await connection.query(
            `SELECT COUNT(*) FROM (SELECT DISTINCT claimee FROM claims) AS temp`);
        
        if(result.rows) {
            const rows: any[] = result.rows;
            console.log('rows stats', rows);
            connection.close();
            return NextResponse.json({
                totalParticipants: rows[0][0],
            })
        } else {
            connection.close();
            return NextResponse.json({
                totalParticipants: 0,
            })
        }
    } catch(err) {
        console.error('Error /api/stats', err);
        if (connection)
            connection.close();
        return NextResponse.json({
            totalParticipants: 0,
        })
    }
}