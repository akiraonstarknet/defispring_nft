import { NextResponse } from "next/server";
import IntractUsers from '@public/intractusers.json';
import { ec, hash, num } from "starknet";
import {Connection} from 'postgresql-client';
import { LEVELS, isIntractUser } from "@/utils";

export const revalidate = 0;

function standariseAddress(address: string | bigint) {
    return num.getHexString(num.getDecimalString(address.toString()));
}

BigInt.prototype.toJSON = function () {
    return this.toString();
};

export async function GET(req: Request, context: any) {
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

        const { params } = context;
        const addr = params.address;

        // standardised address
        let pAddr = addr;
        try {
            pAddr = standariseAddress(addr);
        } catch (e) {
            throw new Error('Invalid address');
        }

        const mocks = {
            l1: [
                "0x5af1e8df8d237cb76493f8305063674496f945c0ed98d5be45dede299c31f99", // akira
                standariseAddress('0x0546EDeAf1f31e30F9B5dC88eD638e62F38992A18d4bc61B5A4351546CeeFAbd'), // damian
            ],
            l4: [
                standariseAddress('0x044B69c21c81220D8F635526aaC87083a692c9228A30471727d190924AAF4Ed0'), // damian
                standariseAddress('0x03a22a9e61d2edcefd604c3a7dc2a57d7629f4321537243e7682fe7fa07546c5') // akira
            ]
        }
        // test TODO remove before commit
        let queryAddr = pAddr;
        if (addr == '0x5af1e8df8d237cb76493f8305063674496f945c0ed98d5be45dede299c31f99') {
            queryAddr = '0x5b55db55f5884856860e63f3595b2ec6b2c9555f3f507b4ca728d8e427b7864'
        }
        
        if(!process.env.ACCOUNT_PK) {
            throw new Error('Invalid signer');
        }

        const result = await connection.query(
            `select claimee, amount from claims where claimee='${queryAddr}'`);
        
        let strkAmount = BigInt(0);
        if(result.rows) {
            const rows: any[] = result.rows;
            console.log('rows', queryAddr, rows);
            rows.forEach(row => {
                strkAmount += BigInt(row[1]);
            }) 
        } else {
            console.log('noData', {
                queryAddr
            })
        }

        let isInteractUser = (<any>IntractUsers)[pAddr] ? true : false;

        // mocks
        if (mocks.l1.includes(pAddr)) {
            strkAmount = BigInt(LEVELS[0].amountSTRK * (10 ** 18));
            isInteractUser = true;
        } else if (mocks.l4.includes(pAddr)) {
            strkAmount = BigInt(LEVELS[3].amountSTRK * (10 ** 18));
        }

        // this allows to sign a sig that allows user to mint upto level 2 NFT
        // without STRK
        let signStrkAmount = strkAmount;
        if (isInteractUser && strkAmount < BigInt(LEVELS[1].amountSTRK * (10 ** 18))) {
            signStrkAmount = BigInt(LEVELS[1].amountSTRK * (10 ** 18));
        }

        const hash1 = hash.computePedersenHash(pAddr, signStrkAmount);
            
        const sig = ec.starkCurve.sign(hash1, process.env.ACCOUNT_PK);

        connection.close();
        return NextResponse.json({
            address: pAddr,
            isIntractUser: isInteractUser,
            strkEarned: strkAmount.toString(),
            signStrkAmount: signStrkAmount.toString(),
            hash: hash1,
            sig: [sig.r, sig.s] 
        })
    } catch(err) {
        console.error('Error /api/users/:address', err);
        if (connection)
            connection.close();
        return NextResponse.json({
            address: '',
            isIntractUser: false,
            strkEarned: '0',
            signStrkAmount: '0',
            hash: '',
            sig: [] 
        }, {
            status: 500
        })
    }
}