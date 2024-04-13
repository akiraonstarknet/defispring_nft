import { v1alpha2 } from "https://esm.run/@apibara/starknet";
import Contracts, { EventProcessors, getProcessorKey } from './contracts.ts';
import { standariseAddress, toBigInt, toNumber } from "./utils.ts";

console.log(Deno.env.get("POSTGRES_CONNECTION_STRING"))
// Initiate a filter builder
const filter: any = {
    events: [],
    header: {weak: false}
}
// Add all contracts to monitor for events into the filter
Object.keys(Contracts).forEach(category => {
    const eventKey = Contracts[category].event_key
    Contracts[category].contracts.forEach(c => {
        filter.events.push({
            fromAddress: c.address,
            keys: [eventKey],
            includeReceipt:false,
            includeReverted: false,
        })
    })
})
export const config = {
    streamUrl: "https://mainnet.starknet.a5a.ch",
    startingBlock: Number(Deno.env.get("START_BLOCK")),
    network: "starknet",
    finality: "DATA_STATUS_ACCEPTED",
    filter: filter,
    sinkType: "postgres",
    sinkOptions: {
        noTls: true,
        tableName: "claims",
    },
};

// Event processor function to store in db
export default function transform({ header, events }: v1alpha2.Block) {
    if (!header || !events) return [];

    const { blockNumber, timestamp } = header;
    return events.map(({ event, transaction }) => {
        if (!transaction || !transaction.meta) return null;
        if (!event || !event.data || !event.keys) return null;
        const key = standariseAddress(event.keys[0])
        const transactionHash = transaction.meta.hash;

        const processorKey = getProcessorKey(event.fromAddress, key)
        
        if (!EventProcessors[processorKey]) {
            const msg = `Event processor not configured: ${processorKey}`
            console.error(msg)
            return null;
        }   

        const claimInfo = EventProcessors[processorKey](event)
        
        const claim: any = {
            block_number: toNumber(toBigInt(blockNumber)),
            txHash: standariseAddress(transactionHash),
            txIndex: toNumber(transaction.meta?.transactionIndex),
            eventIndex: toNumber(event.index),
            contract: standariseAddress(event.fromAddress),
            claimee: claimInfo.claimee,
            amount: claimInfo.amount.toString(),
            eventKey: claimInfo.eventKey,
            timestamp: toNumber(timestamp?.seconds),
        };
        return claim;
    }).filter(e => e != null)
}