import { NextResponse } from "next/server";
import IntractUsers from '@public/intractusers.json';
import { num } from "starknet";

function standariseAddress(address: string | bigint) {
    return num.getHexString(num.getDecimalString(address.toString()));
}

export async function GET(req: Request, context: any) {
    const { params } = context;
    const addr = params.address;

    // standardised address
    let pAddr = addr;
    try {
        pAddr = standariseAddress(addr);
    } catch (e) {
        throw new Error('Invalid address');
    }

    const isInteractUser = (<any>IntractUsers)[pAddr] ? true : false;

    return NextResponse.json({
        address: pAddr,
        isIntractUser: isInteractUser,
        strkEarned: (2 * 10**18).toString()
    })
}