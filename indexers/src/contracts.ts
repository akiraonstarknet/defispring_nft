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
            },
            {
                "address": "0x00dc347ea9e7dc2a307e853b97e7189dfb08679a98e8d5ba549a1872febf2e5d",
                "protocol": "10KSwap",
                "remarks": "COMMON"
            },
            {
                "address": "0x05eb02e164f78fd91b9be6a0b9b3aa02c936db485bd760730f65711533c70a26",
                "protocol": "Haiko",
                "remarks": "COMMON"
            },
            {
                "address": "0x005763f02381e89C6894FFEA078D1CF9e58dA0EAd33d5B52aA608ACc04063053",
                "protocol": "MySwap",
                "remarks": "COMMON"
            },
            {
                "address": "0x0575a33680cca4beb4c3efb7297b7ee0f7bb4e672a9149c4691f1409e6c94322",
                "protocol": "Sithswap",
                "remarks": "COMMON"
            },
            {
                "address": "0x07e71f1efb9cb53253627449b5599842daa61c68bb04743609a96111a94f0f3b",
                "protocol": "StarkDefi",
                "remarks": "COMMON"
            },
            {
                "address": "0x0354ae0842a8d49069f03f61701eaacc19733ec35352724f420acda500b8bedb",
                "protocol": "Nostra",
                "remarks": "ROUND_SPECIFIC"
            },
            {
                "address": "0x7df3257d11cdbea698450bfa0b54f219e40447c4920511a74784d2f4ddac017",
                "protocol": "Nostra",
                "remarks": "ROUND_SPECIFIC"
            },
            {
                "address": "0x6f80b8e79c5a4f60aaa1d5d251e2dfc55496ed748f96cf38c034de6d578f3f",
                "protocol": "Nostra",
                "remarks": "ROUND_SPECIFIC"
            },
            {
                "address": "0x6eb587e14ebd9556db09f8d5854ae54bc24736e0e163443b3f7547e6cc908ea",
                "protocol": "Nostra",
                "remarks": "ROUND_SPECIFIC"
            },

        ]
    },
    "ekubo_classhash": {
        "classhash": "0x01cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14",
        "event_key": EKUBO_EVENT_KEY,
        "processor": ekuboEventProcessor,
        "contracts": [
            {
                "address": "0x03a3cc51e76135caee3473680a11f64db87537a0252f805d60e69f31e1a7e9b4",
                "protocol": "Ekubo",
                "remarks": "ROUND_SPECIFIC"
            },
            {
                "address": "0x054ead9cbb7c140dd4f653aaad1f935ba8f8c002a2b8afea77793fdf8d1d80d3",
                "protocol": "Ekubo",
                "remarks": "ROUND_SPECIFIC"
            },
            {
                "address": "0x079fea253b4424e0d4bf251c97b0b0f70e682b3d86952b8f534f150b05ae9afe",
                "protocol": "Ekubo",
                "remarks": "ROUND_SPECIFIC"
            },
            {
                "address": "0x078597e910132071274f2664664AB069cc0A4682f73E701D723B6fC2E8930b1b",
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