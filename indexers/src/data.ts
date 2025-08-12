import { PrismaClient } from "@prisma/client";
import ProcessedContracts from './processed_contracts.json';
import { num } from "starknet";
import dotenv from 'dotenv';
// import { NewContracts } from "./contracts";
import NewContracts from './new_contracts.json';
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
    // return;
    const totalTx = await prisma.claims.count({
        where: {
            block_number: {
                gte: 662868,
                lt: 662878
            }
        }
    })
    console.log('totalTx: ', totalTx)
    return;
    
    // const data = await prisma.claims.findMany({
    //     where: {
    //     },
    //     distinct: ['contract'],
    //     select: {
    //         contract: true
    //     }
    // })
    // console.log('unique contracts: ', data.length)

    
    // Can i improve my query?
    const myInfo = await prisma.claims.findMany({
        where: {
            claimee: standariseAddress('0x003c27ae437552dbc0c61f1029d63973d095874651f7caf44c8f54c61dbb5105'),
            // contract: standariseAddress('0x003d0231d65ec6fa55a28923c365ec4d54b7b1a987620715a56a6dd86d19fbb8')
        }
    })
    let sum = BigInt(0);
    const filtered: any[] = [];
    myInfo.map(m => {
        const c = ProcessedContracts.find(p => standariseAddress(p.contractAddress) === m.contract);
        const amt = BigInt(m.amount);
        sum += amt;
        if (amt > 0) {
            filtered.push({
                ...m,
            })
        }
        console.log({
            tx: m.txHash,
            amt: (Number(amt / BigInt(10**15)) / 1000).toString()
        })
        return {
            ...m,
            protocol: c?.protocol,
            amt: (Number(amt / BigInt(10**15)) / 1000).toString()
        }
    })
    // console.log(filtered)
    // console.log(filtered.length);
    console.log('myInfo: ', myInfo.length)
    console.log('sum: ', (sum / BigInt(10**18)).toString())
    
    return;
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
            // block_number: {
            //     gt: 1024182,
            // },
            contract: {
                in: NewContracts.map(c => standariseAddress(c.contractAddress))
            }
        }
    })
    console.log('deleted: ', data)
}

async function getContractsNotTrakced() {
    const notTracked: any[] = [];
    const prisma = new PrismaClient();
    for (let i=0; i<ProcessedContracts.length; ++i) {
        console.log(`checking: ${i}/${ProcessedContracts.length}`)
        const addr = ProcessedContracts[i].contractAddress;
        const data = await prisma.claims.count({
            where: {
                contract: standariseAddress(addr)
            }
        })        
        if (data === 0) {
            notTracked.push({
                contractAddress: addr,
                protocol: ProcessedContracts[i].protocol,
                classHash: ProcessedContracts[i].classHash
            })
            console.log('not tracked: ', addr)
        } else {
            console.log(`length: ${data}`)
        }
    }
    console.log('notTracked: ', notTracked);
}

async function getConctractsWithNoClaims() {
    const processed = ProcessedContracts.map(c => standariseAddress(c.contractAddress));
    const prisma = new PrismaClient();
    const data = await prisma.claims.findMany({
        where: {
            contract: {
                in: processed
            }
        },
        distinct: ['contract'],
        select: {
            contract: true
        }
    })
    const missing = processed.filter(p => !data.find(d => d.contract === p));
    console.log('missing: ', missing.map(m => ({
        contractAddress: m,
        classHash: '',
        protocol: ''
    })));
}

if (require.main === module) {
    // async function runBulk() {
    //     const addresses: string[] = [];
    //     const prisma = new PrismaClient();

    //     const data = await prisma.claims.findMany({
    //         wh
    //     })
    // }
    run()
    // getConctractsWithNoClaims();
    // nimboraAcc()
    // getContractsNotTrakced();
    // deleteAbove();
}