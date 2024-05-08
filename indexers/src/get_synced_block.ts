import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

async function run() {
    const prisma = new PrismaClient();
    const latestBlock = await prisma.claims.findFirst({
        orderBy: { block_number: 'desc' }
    });

    if (!latestBlock) {
        writeFileSync('latest_block.json', JSON.stringify({
            block: '603256', // start block of campaign
        }));
    } else {
        writeFileSync('latest_block.json', JSON.stringify({
            block: latestBlock.block_number,
        }));
    }

    console.log("Latest block: ", latestBlock?.block_number);
    console.log("Data written to latest_block.json")
}

run();