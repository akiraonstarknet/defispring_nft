import { v1alpha2 } from "https://esm.run/@apibara/starknet";
import Contracts, { EventProcessors, getProcessorKey } from './contracts.ts';
import { standariseAddress, toBigInt, toHex, toNumber } from "./utils.ts";

// Initiate a filter builder
const filter: any = {
    events: [{
        fromAddress: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", // STRK
        keys: ["0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9"],
        data: ['0x51ba9be967d17aaafac92f9bc7ca4b035dfd3c4a97b32be1773f63e27b0526a'],
        includeReceipt:false,
        includeReverted: false,
    }],
    header: {weak: false}
}

export const config = {
    streamUrl: "https://mainnet.starknet.a5a.ch",
    startingBlock: 621631,
    network: "starknet",
    finality: "DATA_STATUS_ACCEPTED",
    filter: filter,
    sinkType: "postgres",
    sinkOptions: {
        noTls: false, // true for private urls, false for public urls
        tableName: "claims",
    },
};

// Event processor function to store in db
export default function transform({ header, events }: v1alpha2.Block) {
    if (!header || !events) return [];
    console.log('block number', header.blockNumber.toString());
    const { blockNumber, timestamp } = header;
    if (blockNumber > 640468) {
        return [];
    }
    const entries = events.map(({ event, transaction }) => {
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
            eventKey: 'NIMBORA-ACC'
        }

        if (claimInfo.from != standariseAddress('0x51ba9be967d17aaafac92f9bc7ca4b035dfd3c4a97b32be1773f63e27b0526a'))
            return null;

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
    }).filter(e => e != null);
    console.log('entries', entries.length);
    return entries;
}