import { v1alpha2 } from "https://esm.run/@apibara/starknet";
import { EventProcessor, IConstracts } from "./types.ts";
import { standariseAddress, toBigInt, toHex } from "./utils.ts";
import ProcessedContracts from './processed_contracts.json' with { type: "json" };

//
// class hash based event processors
//

// For Distribution class hash provided by foundation
const snfEventProcessor: EventProcessor = (event: v1alpha2.IEvent) => {
    if (!event || !event.data || !event.keys) 
        throw new Error('SNFCH:Expected event with data');

    return {
        claimee: toHex(event.data[0]),
        amount: toBigInt(event.data[1]),
        eventKey: 'SNF'
    }
}

// for Distribution class hash designed by Ekubo
const ekuboEventProcessor: EventProcessor = (event: v1alpha2.IEvent) => {
    if (!event || !event.data || !event.keys) 
        throw new Error('EKUBOCH:Expected event with data');
    
    return {
        claimee: toHex(event.data[1]),
        amount: 0n, //FieldElement.toBigInt(event.data[2]),
        eventKey: 'EKUBO'
    }
}

export function getProcessorKey(contract: string, eventKey: string) {
    return `${toHex(contract)}_${toHex(eventKey)}`
}

// Claimed event name
const SNF_EVENT_KEY = standariseAddress("0x35cc0235f835cc84da50813dc84eb10a75e24a21d74d6d86278c0f037cb7429");
const EKUBO_EVENT_KEY = standariseAddress("0x35cc0235f835cc84da50813dc84eb10a75e24a21d74d6d86278c0f037cb7429");

export const EventProcessors: {[event_key: string]: EventProcessor} = {}

const _contracts: IConstracts = {
    "snf_classhash": {
        "classhash": "0x006a54af2934978ac59b27b91291d3da634f161fd5f22a2993da425893c44c64",
        "event_key": SNF_EVENT_KEY,
        "processor": snfEventProcessor,
        "contracts": []
    },
    "ekubo_classhash": {
        "classhash": "0x01cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14",
        "event_key": EKUBO_EVENT_KEY,
        "processor": ekuboEventProcessor,
        "contracts": []
    },
    "ekubo2_classhash": {
        "classhash": "0x21c6c54d027a8d37077b9b45e0aea4c5f22e40c59aba378f64e8cecc6b4a944",
        "event_key": EKUBO_EVENT_KEY,
        "processor": ekuboEventProcessor,
        "contracts": []
    }
}

ProcessedContracts.forEach(contract => {
    const cls = contract.classHash;
    const index = Object.keys(_contracts).findIndex(ch => {
        return standariseAddress(_contracts[ch].classhash) === standariseAddress(cls)
    });
    if (index >= 0) {
        _contracts[Object.keys(_contracts)[index]].contracts.push({
            address: contract.contractAddress,
            protocol: contract.protocol
        });
    }
})

Object.keys(_contracts).forEach(ch => {
    _contracts[ch].contracts.forEach(contract => {
        EventProcessors[getProcessorKey(contract.address, _contracts[ch].event_key)] = _contracts[ch].processor
    })
})

export default _contracts;