import { v1alpha2 } from "https://esm.run/@apibara/starknet";
import { NewContracts } from './contracts.ts';
import { standariseAddress, toBigInt, toHex, toNumber } from "./utils.ts";

// Initiate a filter builder
const filter: any = {
    events: [],
    header: {weak: false}
}
// Add all contracts to monitor for events into the filter
Object.keys(NewContracts).forEach(category => {
    const eventKey = NewContracts[category].event_key
    NewContracts[category].contracts.forEach(c => {
        filter.events.push({
            fromAddress: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", // STRK
            keys: ["0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9"], // Transfer event
            data: [c.address],
            includeReceipt:false,
            includeReverted: false,
        })
    })
})

console.log(`tracking ${filter.events.length} contracts`);

export const config = {
    streamUrl: "https://mainnet.starknet.a5a.ch",
    startingBlock: 664125, // ! REMEMBER TO UPDATE THIS ON EACH SYNC
    network: "starknet",
    finality: "DATA_STATUS_ACCEPTED",
    filter: filter,
    sinkType: "postgres",
    sinkOptions: {
        noTls: false, // true for private urls, false for public urls
        tableName: "claims",
    },
};

// ! REMEMBER TO UPDATE THIS ON EACH SYNC
const MAX_BLOCK = 664990;

// Event processor function to store in db
export default function transform({ header, events }: v1alpha2.Block) {
    if (!header || !events) return [];

    const { blockNumber, timestamp } = header;
    if (blockNumber > MAX_BLOCK) return [];

    return events.map(({ event, transaction }) => {
        if (!transaction || !transaction.meta) return null;
        if (!event || !event.data || !event.keys) return null;
        const key = standariseAddress(event.keys[0]);
        if (key != '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9') {
            return null;
        }
        const transactionHash = transaction.meta.hash;

        if (!event || !event.data || !event.keys) 
            throw new Error('SNFCH:Expected event with data');

        const claimInfo = {
            from: toHex(event.data[0]),
            claimee: toHex(event.data[1]),
            amount: toBigInt(event.data[2]),
            eventKey: 'Transfer'
        }

        const claim: any = {
            block_number: toNumber(toBigInt(blockNumber)),
            txHash: standariseAddress(transactionHash),
            txIndex: toNumber(transaction.meta?.transactionIndex),
            eventIndex: toNumber(event.index),
            contract: claimInfo.from,
            claimee: claimInfo.claimee,
            amount:claimInfo.amount.toString(),
            eventKey: claimInfo.eventKey,
            timestamp: toNumber(timestamp?.seconds),
        };
        return claim;
    }).filter(e => e != null)
}
