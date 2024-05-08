import { NextResponse } from "next/server";
import IntractUsers from '@public/intractusers.json';
import { ec, hash, num } from "starknet";
import {Connection} from 'postgresql-client';
import { LEVELS } from "@/utils";

export const revalidate = 0;

function standariseAddress(address: string | bigint) {
    return num.getHexString(num.getDecimalString(address.toString()));
}

export async function GET(req: Request, context: any) {
    const connection = new Connection(process.env.DATABASE_URL);
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

    // test TODO remove before commit
    let queryAddr = pAddr;
    if (addr == '0x5af1e8df8d237cb76493f8305063674496f945c0ed98d5be45dede299c31f99') {
        queryAddr = '0x5b55db55f5884856860e63f3595b2ec6b2c9555f3f507b4ca728d8e427b7864'
    }
    
    if(!process.env.ACCOUNT_PK) {
        throw new Error('Invalid signer');
    }

    let strkAmount = BigInt(10000 * (10 ** 18));

    const result = await connection.query(
        `select claimee, amount from claims where claimee='${queryAddr}'`);
    
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

    const isInteractUser = (<any>IntractUsers)[pAddr] ? true : false;

    // this allows to sign a sig that allows user to mint upto level 2 NFT
    // without STRK
    let signStrkAmount = strkAmount;
    if (isInteractUser && strkAmount < BigInt(LEVELS[1].amountSTRK * (10 ** 18))) {
        signStrkAmount = BigInt(LEVELS[1].amountSTRK * (10 ** 18));
    }

    const hash1 = hash.computePedersenHash(pAddr, signStrkAmount);
        
    const sig = ec.starkCurve.sign(hash1, process.env.ACCOUNT_PK);

    return NextResponse.json({
        address: pAddr,
        isIntractUser: isInteractUser,
        strkEarned: strkAmount.toString(),
        signStrkAmount: signStrkAmount.toString(),
        hash: hash1,
        sig: [sig.r, sig.s] 
    })
}