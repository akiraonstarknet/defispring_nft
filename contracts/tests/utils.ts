import dotenv from 'dotenv';
dotenv.config();
import assert from 'assert'
import {Account, RawArgs, RpcProvider, TransactionExecutionStatus, extractContractHashes, hash, json, provider} from 'starknet'
import { readFileSync, existsSync, writeFileSync } from 'fs'

export function getRpcProvider() {
    assert(process.env.RPC_URL, 'invalid RPC_URL');
    return new RpcProvider({nodeUrl: process.env.RPC_URL})
}

export function getContracts() {
    const PATH = './contracts.json'
    if (existsSync(PATH)) {
        return JSON.parse(readFileSync(PATH, {encoding: 'utf-8'}))
    }
    return {}
}

function saveContracts(contracts: any) {
    const PATH = './contracts.json'
    writeFileSync(PATH, JSON.stringify(contracts));
}

export function getAccount() {
    assert(process.env.SECRET_FILE_FOLDER, 'invalid SECRET_FILE_FOLDER')
    assert(process.env.NETWORK, 'invalid NETWORK')
    let data = JSON.parse(readFileSync(`${process.env.SECRET_FILE_FOLDER}/account_${process.env.NETWORK}.json`, {
        encoding: 'utf-8'
    }));

    return new Account(getRpcProvider(), data.address, data.pk);
}

export async function myDeclare(contract_name: string) {
    const provider = getRpcProvider();
    const acc = getAccount();
    const compiledSierra = json.parse(
        readFileSync(`./target/dev/defispring_${contract_name}.contract_class.json`).toString("ascii")
    )
    const compiledCasm = json.parse(
    readFileSync(`./target/dev/defispring_${contract_name}.compiled_contract_class.json`).toString("ascii")
    )
    
    const contracts = getContracts();
    const payload = {
        contract: compiledSierra,
        casm: compiledCasm
    };
    
    console.log(extractContractHashes(payload).classHash);
    
    // const fee = await acc.estimateDeclareFee({
    //     contract: compiledSierra,
    //     casm: compiledCasm, 
    // })
    // console.log('declare fee', Number(fee.suggestedMaxFee) / 10 ** 18, 'ETH')
    
    const tx = await acc.declareIfNot(payload, {
        maxFee: 3 * 10**15
    })
    if (tx.transaction_hash) {
        console.log(`Declaring: ${contract_name}`, tx.transaction_hash);
        await provider.waitForTransaction(tx.transaction_hash, {
            successStates: [TransactionExecutionStatus.SUCCEEDED]
        })
    }
    if (!contracts.class_hashes) {
        contracts['class_hashes'] = {};
    }

    // Todo attach cairo and scarb version. and commit ID
    contracts.class_hashes[contract_name] = tx.class_hash;
    saveContracts(contracts);
    console.log(`Contract declared: ${contract_name}`)
    console.log(`Class hash: ${tx.class_hash}`)
    return tx;
}

export async function deployContract(contract_name: string, classHash: string, constructorData: RawArgs) {
    const provider = getRpcProvider();
    const acc = getAccount();

    const fee = await acc.estimateDeployFee({
        classHash,
        constructorCalldata: constructorData,
        unique: true
    })
    console.log("Deploy fee", contract_name, Number(fee.suggestedMaxFee) / 10 ** 18, 'ETH')

    const tx = await acc.deployContract({
        classHash,
        constructorCalldata: constructorData,
    }, {
        maxFee: 3 * (10**15)
    })
    console.log('Deploy tx: ', tx.transaction_hash);
    await provider.waitForTransaction(tx.transaction_hash, {
        successStates: [TransactionExecutionStatus.SUCCEEDED]
    })
    const contracts = getContracts();
    if (!contracts.contracts) {
        contracts['contracts'] = {};
    }
    contracts.contracts[contract_name] = tx.contract_address;
    saveContracts(contracts);
    console.log(`Contract deployed: ${contract_name}`)
    console.log(`Address: ${tx.contract_address}`)
    return tx;
}