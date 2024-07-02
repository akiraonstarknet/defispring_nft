import { PrismaClient } from "@prisma/client";
import ProcessedContracts from './processed_contracts.json';
import { num } from "starknet";

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

    const data = await prisma.claims.findMany({
        where: {},
        distinct: ['contract'],
        select: {
            contract: true
        }
    })
    console.log('unique contracts: ', data.length)
    
    // Can i improve my query?
    const myInfo = await prisma.claims.findMany({
        where: {
            claimee: standariseAddress('0x078A1c18E4FEfb6f2da9dc2159bB8Db2a316305fF42B435f33EefcE3bd268416')
        }
    })
    console.log('myInfo: ', myInfo.length)
    let sum = BigInt(0);
    console.log(myInfo.map(m => {
        const c = ProcessedContracts.find(p => standariseAddress(p.contractAddress) === m.contract);
        const amt = BigInt(m.amount) / BigInt(10**18);
        sum += amt;
        return {
            ...m,
            protocol: c?.protocol,
            amt: amt.toString()
        }
    }))
    console.log('sum: ', sum)

    const totalSTRKClaimed = await prisma.claims.findMany({
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
        distinct: ['claimee'],
        select: {
            claimee: true
        }
    })
    console.log('uniqueUsers: ', uniqueUsers.length)

    const lastBlock = await prisma.claims.findFirst({
        orderBy: {
            block_number: 'desc'
        },
        select: {
            block_number: true
        }
    })
    console.log('lastBlock: ', lastBlock)
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

run()
// nimboraAcc()