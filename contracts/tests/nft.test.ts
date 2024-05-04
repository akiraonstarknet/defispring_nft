import { Account, Contract, byteArray, ec, encode, hash, num, shortString } from "starknet";
import { deployContract, getAccount, getContracts, getRpcProvider, myDeclare } from "./utils";
import { readFileSync, existsSync, writeFileSync } from 'fs'
import {describe, beforeAll, it, jest, expect} from '@jest/globals';

describe("NFT", function () {
    jest.setTimeout(1000000);
    const contractName = "DeFiSpringNFT";
    const baseURI = 'https://tomato-recent-macaw-184.mypinata.cloud/ipfs/QmZdRSojzaM2aRaX39MneeFQs86uWxihx9n8N2uXhjkPtF/metadata{id}'
    let classhash = ""
    const provider = getRpcProvider();
    const acc = getAccount();
    let contract: Contract;

    async function deploy(class_hash: string) {
        let tx = await deployContract(contractName, class_hash, {
            name: byteArray.byteArrayFromString("DeFiSpringNFT"),
            symbol: byteArray.byteArrayFromString("DSNFT"),
            base_uri: byteArray.byteArrayFromString(baseURI),
            owner: acc.address,
            settings: {
                maxNFTs: 4,
                minEarning1: 10 * (10**18),
                minEarning2: "100000000000000000000",
                minEarning3: "1000000000000000000000",
                minEarning4: "10000000000000000000000",
            },
            pubkey: await acc.signer.getPubKey()
        })
        while (true) {
            try {
                const classInfo = await getRpcProvider().getClassAt(tx.address);
                return new Contract(classInfo.abi, tx.address, getRpcProvider())
            } catch(err) {
                console.log('Waiting to detect classhash...', err)
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    beforeAll(async () => {
        let existingContracts = getContracts();
        if (!existingContracts.contracts || !existingContracts.contracts[contractName]) {
            let ch = await myDeclare(contractName);
            contract = await deploy(ch.class_hash);   
        }

        existingContracts = getContracts();
        let address = existingContracts.contracts[contractName]
        classhash = existingContracts.class_hashes[contractName]
        while (true) {
            try {
                const classInfo = await getRpcProvider().getClassAt(address);
                contract = new Contract(classInfo.abi, address, getRpcProvider());
                break;
            } catch(err) {
                console.log('Waiting to detect classhash...', err)
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    })

    it ("View props", async () => {
        let name = await contract.call("name", []);
        expect(name).toBe("DeFiSpringNFT");

        let symbol = await contract.call("symbol", []);
        expect(symbol).toBe("DSNFT");

        let settings: any = await contract.call("get_settings", []);
        expect(Number(settings.maxNFTs)).toBe(4);
        expect(Number(settings.minEarning1)).toBe(10 * (10**18));
        expect(Number(settings.minEarning2)).toBe(100 * (10**18));
        expect(Number(settings.minEarning3)).toBe(1000 * (10**18));
        expect(Number(settings.minEarning4)).toBe(10000 * (10**18));

        let pubkey: any = await contract.call("get_pubkey", []);
        expect(num.getHexString(pubkey)).toBe(await acc.signer.getPubKey());

        let owner: any = await contract.call("owner", []);
        expect(num.getHexString(owner)).toBe(num.getHexString(num.getDecimalString(acc.address)));

        let uri = await contract.call("uri", [1]);
        expect(uri).toBe(`${baseURI}`);
    })

    it("Mint: Should pass", async () => {
        let contract = await deploy(classhash);   
        let level1Amount = 10 * (10**18);
        const hash1 = hash.computePedersenHash(acc.address, "10000000000000000000");
        
        let data = JSON.parse(readFileSync(`${process.env.SECRET_FILE_FOLDER}/account_${process.env.NETWORK}.json`, {
            encoding: 'utf-8'
        }));

        const sig = ec.starkCurve.sign(hash1, data.pk);

        let preBal = await contract.balanceOf(acc.address, 1);
        expect(Number(preBal)).toBe(0);

        let mintCall = contract.populate("mint", [
            level1Amount,
            hash1,
            [sig.r, sig.s],
        ])

        const tx = await acc.execute([mintCall], undefined, {
            maxFee: 10**15
        });
        await provider.waitForTransaction(tx.transaction_hash);

        while (true) {
            let postBal = await contract.balanceOf(acc.address, 1);
            if (Number(postBal) === 1) {
                break;
            }
            console.log('Waiting for minting to complete...')
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log("Done minting");
    })

    it("Mint: Should pass multi mint", async () => {
        let contract = await deploy(classhash);
        let level2Amount = 100 * (10**18);
        const hash1 = hash.computePedersenHash(acc.address, "100000000000000000000");
        
        let data = JSON.parse(readFileSync(`${process.env.SECRET_FILE_FOLDER}/account_${process.env.NETWORK}.json`, {
            encoding: 'utf-8'
        }));

        const sig = ec.starkCurve.sign(hash1, data.pk);

        let preBal = await contract.balanceOf(acc.address, 1);
        expect(Number(preBal)).toBe(0);
        let preBal2 = await contract.balanceOf(acc.address, 0);
        expect(Number(preBal2)).toBe(0);

        let mintCall = contract.populate("mint", [
            level2Amount,
            hash1,
            [sig.r, sig.s],
        ])

        const tx = await acc.execute([mintCall], undefined, {
            maxFee: 10**15
        });
        await provider.waitForTransaction(tx.transaction_hash);

        while (true) {
            let postBal = await contract.balanceOf(acc.address, 1);
            if (Number(postBal) === 1) {
                let postBal2 = await contract.balanceOf(acc.address, 2);
                if (Number(postBal2) === 1) {
                    break;
                }
            }
            console.log('Waiting for minting to complete...')
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log("Done minting");
    })

    it("Mint: Should pass boundary test", async () => {
        let contract = await deploy(classhash);
        let level2Amount = "98999999999999999999";
        const hash1 = hash.computePedersenHash(acc.address, "98999999999999999999");
        
        let data = JSON.parse(readFileSync(`${process.env.SECRET_FILE_FOLDER}/account_${process.env.NETWORK}.json`, {
            encoding: 'utf-8'
        }));

        const sig = ec.starkCurve.sign(hash1, data.pk);

        let preBal = await contract.balanceOf(acc.address, 1);
        expect(Number(preBal)).toBe(0);
        let preBal2 = await contract.balanceOf(acc.address, 0);
        expect(Number(preBal2)).toBe(0);

        let mintCall = contract.populate("mint", [
            level2Amount,
            hash1,
            [sig.r, sig.s],
        ])

        const tx = await acc.execute([mintCall], undefined, {
            maxFee: 10**15
        });
        await provider.waitForTransaction(tx.transaction_hash);

        while (true) {
            let postBal = await contract.balanceOf(acc.address, 1);
            console.log("Post balance", postBal);
            if (Number(postBal) === 1) {
                let postBal2 = await contract.balanceOf(acc.address, 2);
                console.log("Post balance 2", postBal2);
                if (Number(postBal2) === 0) {
                    break;
                }
            }
            console.log('Waiting for minting to complete...')
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log("Done minting");
    })

    it("Mint: Should fail invalid hash", async () => {
        let level1Amount = 10 * (10**18);
        const hash1 = hash.computePedersenHash(acc.address, "10000000000000000000");
        
        let data = JSON.parse(readFileSync(`${process.env.SECRET_FILE_FOLDER}/account_${process.env.NETWORK}.json`, {
            encoding: 'utf-8'
        }));

        const sig = ec.starkCurve.sign(hash1, data.pk);

        let mintCall = contract.populate("mint", [
            level1Amount * 2,
            hash1,
            [sig.r, sig.s],
        ])

        try {
            const tx = await acc.execute([mintCall]);
            await provider.waitForTransaction(tx.transaction_hash);
        } catch(err) {
            let error = JSON.stringify(err,
                Object.getOwnPropertyNames(err)
            );
            expect(error).toContain("Invalid hash");
        }
    })

    it("Mint: Should fail invalid signature", async () => {
        let level1Amount = 10 * (10**18);
        const hash1 = hash.computePedersenHash(acc.address, "10000000000000000000");
        
        let data = JSON.parse(readFileSync(`${process.env.SECRET_FILE_FOLDER}/account_${process.env.NETWORK}.json`, {
            encoding: 'utf-8'
        }));

        const sig = ec.starkCurve.sign(hash1, data.pk);

        let mintCall = contract.populate("mint", [
            level1Amount,
            hash1,
            [sig.r, sig.r],
        ])

        try {
            const tx = await acc.execute([mintCall]);
            await provider.waitForTransaction(tx.transaction_hash);
        } catch(err) {
            let error = JSON.stringify(err,
                Object.getOwnPropertyNames(err)
            );
            expect(error).toContain("Invalid signature");
        }
    })

    it("Mint: Should fail Not eligible", async () => {
        let level1Amount = 1 * (10**18);
        const hash1 = hash.computePedersenHash(acc.address, "1000000000000000000");
        
        let data = JSON.parse(readFileSync(`${process.env.SECRET_FILE_FOLDER}/account_${process.env.NETWORK}.json`, {
            encoding: 'utf-8'
        }));

        const sig = ec.starkCurve.sign(hash1, data.pk);

        let mintCall = contract.populate("mint", [
            level1Amount,
            hash1,
            [sig.r, sig.s],
        ])

        try {
            const tx = await acc.execute([mintCall]);
            await provider.waitForTransaction(tx.transaction_hash);
        } catch(err) {
            let error = JSON.stringify(err,
                Object.getOwnPropertyNames(err)
            );
            expect(error).toContain("Not eligible");
        }
    })

    
})