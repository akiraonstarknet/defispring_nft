import { RpcProvider } from 'starknet'
import fs from 'fs';
import ProcessedContracts from './processed_contracts.json';

/**
 * Reads distribution contracts from a url
 * and saves them in a json file along with their class hashes
 */


/** Required ContractInfo */
interface ContractInfo {
    classHash: string;
    contractAddress: string;
    protocol: string;
}

async function run() {
    const provider = new RpcProvider({
        nodeUrl: 'https://starknet-mainnet.public.blastapi.io'
    });

    const result = await fetch('https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/starknet/fetchFile?file=address_settings/settings.json');
    const RawContracts = await result.json();
    console.log('Total contracts (includes duplicates): ', RawContracts.length);

    const uniqueClasses: string[] = [];
    const processedContracts: ContractInfo[] = [];
    const newContracts: ContractInfo[] = [];
    const contractClassMap = new Map<string, string>();

    const classesToExclude = ['0x737ee2f87ce571a58c6c8da558ec18a07ceb64a6172d5ec46171fbc80077a48']

    for(let i=0; i<RawContracts.length; ++i) {
        const contract = RawContracts[i]
        if (!contractClassMap.get(contract.Address)) {
            const cls = await provider.getClassHashAt(contract.Address)
            if (classesToExclude.includes(cls)) {
                continue;
            }
            if (!uniqueClasses.includes(cls))
                uniqueClasses.push(cls)
            processedContracts.push({
                classHash: cls,
                contractAddress: contract.Address,
                protocol: contract['Protocol Name']
            });
            
            // separately store new contracts each round
            const exists = ProcessedContracts.find(p => p.contractAddress === contract.Address);
            if (!exists) {
                newContracts.push({
                    classHash: cls,
                    contractAddress: contract.Address,
                    protocol: contract['Protocol Name']
                });
            }
            contractClassMap.set(contract.Address, cls);
        } else {
            console.log(`Skipping duplicate contract: ${contract['Protocol Name']} at ${contract.Address}`);
        }

        // log stats
        console.log(`Processed ${i + 1}/${RawContracts.length} contracts. Unique classes: ${uniqueClasses.length}`);
    }

    fs.writeFileSync('./src/processed_contracts.json', JSON.stringify(processedContracts), {
        encoding: 'utf-8'
    });fs.writeFileSync('./src/new_contracts.json', JSON.stringify(newContracts), {
        encoding: 'utf-8'
    });
    console.log(`Unique classes: ${JSON.stringify(uniqueClasses)}`)
    console.log('Contracts written to src/processed_contracts.json');
}

run();