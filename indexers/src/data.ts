import { PrismaClient } from "@prisma/client";

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

    const myInfo = await prisma.claims.findMany({
        where: {
            claimee: '0x5b55db55f5884856860e63f3595b2ec6b2c9555f3f507b4ca728d8e427b7864'
        }
    })
    console.log('myInfo: ', myInfo.length)

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

run()