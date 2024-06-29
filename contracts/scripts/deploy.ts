import { Account, Contract, TransactionExecutionStatus, byteArray } from "starknet";
import { deployContract, getAccount, getRpcProvider, myDeclare } from "../tests/utils";

const contractName = "DeFiSpringNFT";
const baseURI = 'https://tomato-recent-macaw-184.mypinata.cloud/ipfs/QmZdRSojzaM2aRaX39MneeFQs86uWxihx9n8N2uXhjkPtF/metadata{id}'
const provider = getRpcProvider();
const acc = getAccount();
const signerAcc = new Account(provider, process.env.ACCOUNT_ADDRESS || '', process.env.ACCOUNT_PK || '');
async function deploy(class_hash: string) {
    console.log('nft signer: ', signerAcc.address);
    await deployContract(contractName, class_hash, {
        name: byteArray.byteArrayFromString("DeFiSpringNFT"),
        symbol: byteArray.byteArrayFromString("DSNFT"),
        base_uri: byteArray.byteArrayFromString(baseURI),
        owner: acc.address,
        settings: {
            maxNFTs: 4,
            minEarnings: [
                (BigInt(100) * BigInt(10**18)).toString(), // 100 STRK
                (BigInt(1000) * BigInt(10**18)).toString() , // 1000 STRK
                (BigInt(7500) * BigInt(10**18)).toString() , // 7500 STRK
                (BigInt(20000) * BigInt(10**18)).toString() , // 20000 STRK
            ]
        },
        pubkey: await signerAcc.signer.getPubKey()
    })
}

async function declareDeploy() {
    let ch = await myDeclare(contractName);
    await deploy(ch.class_hash);   
}

async function updateSettings() {
    const contractAddr = '0x40b47fa507a1a4977011f8e818975a065a54ef26e82b871cdd114f87e2d67b1';
    const cls = await provider.getClassAt(contractAddr);
    const contract = new Contract(cls.abi, contractAddr, provider);
    const call = contract.populate('set_settings', {
        settings: {
            maxNFTs: 4,
            minEarnings: [
                (BigInt(100) * BigInt(10**18)).toString(), // 100 STRK
                (BigInt(1000) * BigInt(10**18)).toString() , // 1000 STRK
                (BigInt(7500) * BigInt(10**18)).toString() , // 7500 STRK
                (BigInt(20000) * BigInt(10**18)).toString() , // 20000 STRK
            ]
        }
    })
    const tx = await acc.execute([call]);
    console.log(`tx hash: ${tx.transaction_hash}`);
    await provider.waitForTransaction(tx.transaction_hash, {
        successStates: [TransactionExecutionStatus.SUCCEEDED]
    })
    console.log('done');
}

async function set_pub_key() {
    const contractAddr = '0x313ba90423b939ff6949ad185e31ebdf4ef1db8d23ba9ba3b2ebcab2ad43d8d';
    const cls = await provider.getClassAt(contractAddr);
    const contract = new Contract(cls.abi, contractAddr, provider);
    const call = contract.populate('set_pubkey', {
        pubkey: await signerAcc.signer.getPubKey()
    })
    const tx = await acc.execute([call]);
    console.log(`tx hash: ${tx.transaction_hash}`);
    await provider.waitForTransaction(tx.transaction_hash, {
        successStates: [TransactionExecutionStatus.SUCCEEDED]
    })
    console.log('done');
}

//
// declareDeploy();
// updateSettings();
set_pub_key();