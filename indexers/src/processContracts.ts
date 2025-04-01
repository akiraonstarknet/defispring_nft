import dotenv from 'dotenv';
dotenv.config();
import { Contract, RpcProvider } from 'starknet'
import fs from 'fs';
import ProcessedContracts from './processed_contracts.json';
import NewContracts from './new_contracts.json';
import { standariseAddress } from './data';

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

const provider = new RpcProvider({
    nodeUrl: process.env.MAINNET_RPC_URL
});

async function run() {

    const result = await fetch('https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/starknet/fetchFile?file=address_settings/settings.json');
    const RawContracts = await result.json();
    console.log('Total contracts (includes duplicates): ', RawContracts.length);

    const uniqueClasses: string[] = [];
    const processedContracts: ContractInfo[] = ProcessedContracts;
    const newContracts: ContractInfo[] = [];
    const contractClassMap = new Map<string, string>();

    const classesToExclude = ['0x737ee2f87ce571a58c6c8da558ec18a07ceb64a6172d5ec46171fbc80077a48']

    const classesMap: any = {
        "0x00703fd2ea6f6e694427cd87189e77fcb5beb2daa404583d2216686dad7cd1c2": "0x1cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14"
    }
    for(let i=0; i<RawContracts.length; ++i) {
        const contract = RawContracts[i]
        if (!contractClassMap.get(contract.Address)) {
            console.log(`Processing contract: ${contract['Protocol Name']} at ${contract.Address}`);
            
            let cls: string = '';
            if (classesMap[contract.Address]) {
                cls = classesMap[contract.Address];
            } else {
                cls = await provider.getClassHashAt(contract.Address);
            }
            if (classesToExclude.includes(cls)) {
                continue;
            }
            if (!uniqueClasses.includes(cls))
                uniqueClasses.push(cls)

            
            // separately store new contracts each round
            const exists = ProcessedContracts.find(p => p.contractAddress === contract.Address);
            if (!exists) {
                newContracts.push({
                    classHash: cls,
                    contractAddress: contract.Address,
                    protocol: contract['Protocol Name']
                });
                processedContracts.push({
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

    // fetch from Ekubo API
    const EKUBO_API = 'https://starknet-mainnet-api.ekubo.org/airdrops/0x0055741fd3ec832f7b9500e24a885b8729f213357be4a8e209c4bca1f3b909ae?token=0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
    const resultEkubo = await fetch(EKUBO_API);
    // console.log('Ekubo API response: ', await resultEkubo.json());
    const items = (await resultEkubo.json());
    for (let i=0; i<items.length; ++i) {
        const info = items[i];
        const claimContract = info.contract_address;
        const exists = ProcessedContracts.find(p => standariseAddress(p.contractAddress) === standariseAddress(claimContract));
        const exists2 = processedContracts.find(p => standariseAddress(p.contractAddress) === standariseAddress(claimContract));
        if (!exists && !exists2) {
            console.log(`New contract: ${claimContract}`);
            const cls = await provider.getClassHashAt(claimContract);
            newContracts.push({
                classHash: cls,
                contractAddress: standariseAddress(claimContract),
                protocol: 'Ekubo'
            });
            processedContracts.push({
                classHash: cls,
                contractAddress: standariseAddress(claimContract),
                protocol: 'Ekubo'
            })
        }
    }

    const ZKLEND_API = 'https://app.zklend.com/api/reward/all/0x541681b9ad63dff1b35f79c78d8477f64857de29a27902f7298f7b620838ea'
    const resultZklend = await fetch(ZKLEND_API);
    const itemsZklend = (await resultZklend.json());
    for (let i=0; i<itemsZklend.length; ++i) {
        const info = itemsZklend[i];
        const claimContract = info.claim_contract;
        const exists = ProcessedContracts.find(p => standariseAddress(p.contractAddress) === standariseAddress(claimContract));
        const exists2 = processedContracts.find(p => standariseAddress(p.contractAddress) === standariseAddress(claimContract));
        if (!exists && !exists2) {
            console.log(`New contract: ${claimContract}`);
            const cls = await provider.getClassHashAt(claimContract);
            newContracts.push({
                classHash: cls,
                contractAddress: standariseAddress(claimContract),
                protocol: 'zkLend'
            });
            processedContracts.push({
                classHash: cls,
                contractAddress: standariseAddress(claimContract),
                protocol: 'zkLend'
            })
        }
    }
   
    console.log(newContracts);
    const ekuboContractsLen = newContracts.filter((n) => n.protocol == 'Ekubo').length;
    console.log(`Ekubo contracts: ${ekuboContractsLen}`);
    // if (ekuboContractsLen != 1) {
    //     console.error(`Expected 1 ekubo contract, found: ${ekuboContractsLen}`);
    //     throw new Error(`Ekubo err`);
    // }
       
    const nostraContractsLend = newContracts.filter((n) => n.protocol == 'Nostra').length;
    console.log(`Nostra contracts: ${nostraContractsLend}`);
    // if (nostraContractsLend != 2) {
    //     console.error(`Expected 2 Nostra contract, found: ${nostraContractsLend}`);
    //     throw new Error(`Nostra err`);
    // }
    fs.writeFileSync('./src/processed_contracts.json', JSON.stringify(processedContracts), {
        encoding: 'utf-8'
    });fs.writeFileSync('./src/new_contracts.json', JSON.stringify(newContracts), {
        encoding: 'utf-8'
    });
    // console.log(`Unique classes: ${JSON.stringify(uniqueClasses)}`)
    console.log('Contracts written to src/processed_contracts.json');

    getStartBlock();
}

function getPreviousWednesday(weeksBefore: number): Date {
    const today = new Date();
    
    // Calculate how many days back to last Wednesday
    let dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    let daysSinceWednesday = (dayOfWeek >= 3) ? dayOfWeek - 3 : dayOfWeek + 4;

    // If today is Monday (1) or after, we go back to the previous Wednesday.
    if (dayOfWeek <= 3 && dayOfWeek !== 0) {
        daysSinceWednesday += 7;
    }

    // Subtract the number of weeksBefore in days
    const totalDaysBack = daysSinceWednesday + (weeksBefore * 7);

    const previousWednesday = new Date(today);
    previousWednesday.setDate(today.getDate() - totalDaysBack);

    return previousWednesday;
}

async function getStartBlock() {

    let block = await provider.getBlockNumber();
    console.log('Current block: ', block);

    const requiredDate = getPreviousWednesday(2);
    let currentBlockDate = new Date((await provider.getBlockWithTxs(block)).timestamp * 1000);
    console.log('Current block date: ', currentBlockDate);

    while (currentBlockDate > requiredDate) {
        block -= 1000;
        currentBlockDate = new Date((await provider.getBlockWithTxs(block)).timestamp * 1000);
    }
    
    console.log('Start block: ', block);
    console.log('Start block date: ', currentBlockDate);
    return block;
}

run();
// getStartBlock()