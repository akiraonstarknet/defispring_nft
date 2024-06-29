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
    console.log(data, data.length)
}

run()