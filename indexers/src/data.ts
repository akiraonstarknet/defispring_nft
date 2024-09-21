import { PrismaClient } from "@prisma/client";
import ProcessedContracts from './processed_contracts.json';
import { num } from "starknet";
import dotenv from 'dotenv';
dotenv.config();

export function standariseAddress(address: string | bigint) {
    let _a = address;
    if (!address) {
        _a = "0";
    }
    const a = num.getHexString(num.getDecimalString(_a.toString()));
    return a;
}

async function run() {
    const prisma = new PrismaClient();
    const lastBlock = await prisma.claims.findFirst({
        orderBy: {
            block_number: 'desc'
        },
        select: {
            block_number: true,
            cursor: true
        }
    })
    console.log('lastBlock: ', lastBlock)

    const totalTx = await prisma.claims.count({
        where: {
            block_number: {
                gte: 662868,
                lt: 662878
            }
        }
    })
    console.log('totalTx: ', totalTx)
    
    const data = await prisma.claims.findMany({
        where: {
        },
        distinct: ['contract'],
        select: {
            contract: true
        }
    })
    console.log('unique contracts: ', data.length)

    
    // Can i improve my query?
    // const myInfo = await prisma.claims.findMany({
    //     where: {
    //         claimee: standariseAddress('0x05b55db55f5884856860e63f3595b2ec6b2c9555f3f507b4ca728d8e427b7864')
    //     }
    // })
    // console.log('myInfo: ', myInfo.length)
    // let sum = BigInt(0);
    // console.log(myInfo.map(m => {
    //     const c = ProcessedContracts.find(p => standariseAddress(p.contractAddress) === m.contract);
    //     const amt = BigInt(m.amount);
    //     sum += amt;
    //     return {
    //         ...m,
    //         protocol: c?.protocol,
    //         amt: (amt / BigInt(10**18)).toString()
    //     }
    // }))
    // console.log('sum: ', (sum / BigInt(10**18)).toString())

    const totalSTRKClaimed = await prisma.claims.findMany({
        select: {
            amount: true
        },
    })
    let amountSum = BigInt(0);
    totalSTRKClaimed.forEach(claim => {
        amountSum += BigInt(claim.amount)
    })
    console.log('totalSTRKClaimed: ', amountSum / BigInt(10**18))

    const uniqueUsers = await prisma.claims.findMany({
        distinct: ['claimee'],
        select: {
            claimee: true
        }
    })
    console.log('uniqueUsers: ', uniqueUsers.length)

    const nTxLatestBlock = await prisma.claims.findMany({
        where: {
            block_number: lastBlock?.block_number
        }
    })
    console.log('nTxLatestBlock: ', nTxLatestBlock.length)

    // nTx prev block
    const nTxPrevBlock = await prisma.claims.findMany({
        where: {
            block_number: lastBlock ? lastBlock.block_number - 1 : 0
        }
    })
    console.log('nTxPrevBlock: ', nTxPrevBlock.length)
}

async function nimboraAcc() {
    const prisma = new PrismaClient();

    const lastBlock = await prisma.claims.findFirst({
        where: {
            eventKey: 'NIMBORA-ACC'
        },
        orderBy: {
            block_number: 'desc'
        },
        select: {
            block_number: true
        }
    })
    console.log('lastBlock: ', lastBlock)
    
    const data = await prisma.claims.findMany({
        where: {
            eventKey: 'NIMBORA-ACC'
        },
        distinct: ['contract'],
        select: {
            contract: true
        }
    })
    console.log('unique contracts: ', data.length)

    const myInfo = await prisma.claims.findMany({
        where: {
            claimee: '0x5b55db55f5884856860e63f3595b2ec6b2c9555f3f507b4ca728d8e427b7864',
            eventKey: 'NIMBORA-ACC'
        }
    })
    console.log('myInfo: ', myInfo.length)

    const totalSTRKClaimed = await prisma.claims.findMany({
        where: {
            eventKey: 'NIMBORA-ACC'
        },
        select: {
            amount: true
        }
    })
    let amountSum = BigInt(0);
    totalSTRKClaimed.forEach(claim => {
        amountSum += BigInt(claim.amount)
    })
    console.log('totalSTRKClaimed: ', amountSum / BigInt(10**18))

    const uniqueUsers = await prisma.claims.findMany({
        where: {
            eventKey: 'NIMBORA-ACC'
        },
        distinct: ['claimee'],
        select: {
            claimee: true
        }
    })
    console.log('uniqueUsers: ', uniqueUsers.length)


}

async function deleteAbove() {
    const prisma = new PrismaClient();
    const data = await prisma.claims.deleteMany({
        where: {
            block_number: {
                gt: 667506,
            }
        }
    })
    console.log('deleted: ', data)
}

// async function runBulk() {
//     const addresses: string[] = [];
//     const prisma = new PrismaClient();

//     const data = await prisma.claims.findMany({
//         wh
//     })
// }
run()
// nimboraAcc()
// deleteAbove();