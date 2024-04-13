import { v1alpha2 } from "https://esm.run/@apibara/starknet@latest";
import { EventProcessor, IConstracts } from "./types.ts";
import { standariseAddress, toBigInt, toHex } from "./utils.ts";


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
        "contracts": [
            {
                "address": "0x027dee8c8c7f28d67bc771afe0c786bfb59d78f0e1ce303a86006b91b98dc3cf",
                "protocol": "Jediswap V1",
                "remarks": "COMMON"
            }
        ]
    },
    "ekubo_classhash": {
        "classhash": "0x01cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14",
        "event_key": EKUBO_EVENT_KEY,
        "processor": ekuboEventProcessor,
        "contracts": [
            {
                "address": "0x054ead9cbb7c140dd4f653aaad1f935ba8f8c002a2b8afea77793fdf8d1d80d3",
                "protocol": "Ekubo",
                "remarks": "ROUND_SPECIFIC"
            }
        ]
    }
}

Object.keys(_contracts).forEach(ch => {
    _contracts[ch].contracts.forEach(contract => {
        EventProcessors[getProcessorKey(contract.address, _contracts[ch].event_key)] = _contracts[ch].processor
    })
})

export default _contracts;