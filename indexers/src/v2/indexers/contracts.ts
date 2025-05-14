import { IConstracts } from '@/types';
import ProcessedContracts from '../../processed_contracts.json' with { type: "json" };
import { standardise } from './utils';
import NewContracts from '../../new_contracts.json' with { type: "json" };

//
// class hash based event processors
//


// Claimed event name
const SNF_EVENT_KEY = standardise("0x35cc0235f835cc84da50813dc84eb10a75e24a21d74d6d86278c0f037cb7429");
const EKUBO_EVENT_KEY = standardise("0x35cc0235f835cc84da50813dc84eb10a75e24a21d74d6d86278c0f037cb7429");

const _contracts: IConstracts = {
    "snf_classhash": {
        "classhash": "0x006a54af2934978ac59b27b91291d3da634f161fd5f22a2993da425893c44c64",
        "event_key": SNF_EVENT_KEY,
        "processor": undefined as any,
        "contracts": []
    },
    "ekubo_classhash": {
        "classhash": "0x01cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14",
        "event_key": EKUBO_EVENT_KEY,
        "processor": undefined as any,
        "contracts": []
    },
    "ekubo2_classhash": {
        "classhash": "0x21c6c54d027a8d37077b9b45e0aea4c5f22e40c59aba378f64e8cecc6b4a944",
        "event_key": EKUBO_EVENT_KEY,
        "processor": undefined as any,
        "contracts": []
    }
}

const _newContracts: IConstracts = {
    "snf_classhash": {
        "classhash": "0x006a54af2934978ac59b27b91291d3da634f161fd5f22a2993da425893c44c64",
        "event_key": SNF_EVENT_KEY,
        "processor": undefined as any,
        "contracts": []
    },
    "ekubo_classhash": {
        "classhash": "0x01cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14",
        "event_key": EKUBO_EVENT_KEY,
        "processor": undefined as any,
        "contracts": []
    },
    "ekubo2_classhash": {
        "classhash": "0x21c6c54d027a8d37077b9b45e0aea4c5f22e40c59aba378f64e8cecc6b4a944",
        "event_key": EKUBO_EVENT_KEY,
        "processor": undefined as any,
        "contracts": []
    }
}

ProcessedContracts.forEach(contract => {
    const cls = contract.classHash;
    const index = Object.keys(_contracts).findIndex(ch => {
        return standardise(_contracts[ch].classhash) === standardise(cls)
    });
    if (index >= 0) {
        _contracts[Object.keys(_contracts)[index]].contracts.push({
            address: contract.contractAddress,
            protocol: contract.protocol
        });
    }
})

NewContracts.forEach(contract => {
    const cls = contract.classHash;
    const index = Object.keys(_newContracts).findIndex(ch => {
        return standardise(_newContracts[ch].classhash) === standardise(cls)
    });
    if (index >= 0) {
        _newContracts[Object.keys(_newContracts)[index]].contracts.push({
            address: contract.contractAddress,
            protocol: contract.protocol
        });
    }
})


export default _contracts;
export const newContracts = _newContracts;