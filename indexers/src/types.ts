// Determines structure of contracts.json
// - used to set all distribution contracts of by protocol
// - and classified by class hash

import { v1alpha2 } from "https://esm.run/@apibara/starknet@latest"

interface IContractInfo {
    address: string,
    protocol: string,
}

export type EventProcessor = (event: v1alpha2.IEvent) => {
    claimee: string,
    amount: bigint,
    eventKey: "SNF" | "EKUBO"
}

interface IContractsByClasshash {
    classhash: string,
    event_key: string,
    processor: EventProcessor,
    contracts: IContractInfo[]
}

export interface IConstracts {
    [key: string]: IContractsByClasshash
}