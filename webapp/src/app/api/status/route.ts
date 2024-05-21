import { NextResponse } from "next/server";
import IntractUsers from '@public/intractusers.json';
import { RpcProvider, ec, hash, num } from "starknet";
import {Connection} from 'postgresql-client';

export const revalidate = 60; // 1min
export async function GET(req: Request) {
    console.log('requesting1')
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
        // @todo modify this to use the rpc provider from .env
        const provider = new RpcProvider({
            // nodeUrl: process.env.RPC_URL,
            nodeUrl: 'https://starknet-mainnet.public.blastapi.io'
        })
        const result = await connection.query(
            `SELECT block_number FROM claims ORDER BY block_number DESC LIMIT 1`);
        const latestBlock = (await provider.getBlockLatestAccepted()).block_number
        if(result.rows) {
            const rows: any[] = result.rows;
            console.log('rows stats', rows);

            const syncedBlock = rows[0][0];
            console.log('latestBlock', latestBlock, syncedBlock);
            
            connection.close();
            return NextResponse.json({
                isActive: latestBlock - syncedBlock < 10,
                latestBlock,
                syncedBlock,
                message: 'Indexers are active'
            }, {
                status: 200
            })
        } else {
            connection.close();
            return NextResponse.json({
                isActive: false,
                latestBlock,
                syncedBlock: 0,
                message: 'Indexers are not active'
            }, {
                status: 500
            })
        }
    } catch(err) {
        console.error('Error /api/status', err);
        if(connection)
            connection.close();
        return NextResponse.json({
            isActive: false,
            latestBlock: 0,
            syncedBlock: 0,
            message: 'Indexers are not active'
        }, {
            status: 500
        })
    }
}