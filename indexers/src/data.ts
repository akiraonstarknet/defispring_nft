import { PrismaClient } from "@prisma/client";
import ProcessedContracts from './processed_contracts.json';
import { Contract, num, RpcProvider, SuccessfulTransactionReceiptResponse } from "starknet";
import dotenv from 'dotenv';
// import { NewContracts } from "./contracts";
import NewContracts from './new_contracts.json';
dotenv.config();

export function standariseAddress(address: string | bigint) {
    let _a = address;
    if (!address) {
        _a = "0";
    }
    const a = num.getHexString(num.getDecimalString(_a.toString()));
    return a;
}

async function run() {
    const prisma = new PrismaClient();
    const lastBlock = await prisma.claims.findFirst({
        orderBy: {
            block_number: 'desc'
        },
        select: {
            block_number: true,
            cursor: true
        }
    })
    console.log('lastBlock: ', lastBlock)
    // return;
    const totalTx = await prisma.claims.count({
        where: {
            block_number: {
                gte: 662868,
                lt: 662878
            }
        }
    })
    console.log('totalTx: ', totalTx)
    
    // const data = await prisma.claims.findMany({
    //     where: {
    //     },
    //     distinct: ['contract'],
    //     select: {
    //         contract: true
    //     }
    // })
    // console.log('unique contracts: ', data.length)

    
    // Can i improve my query?
    const myInfo = await prisma.claims.findMany({
        orderBy: {
          block_number: 'desc'
        },
        where: {
            claimee: standariseAddress('0x02D86897DaaDeE2DFFDB5C5B734aB568fE849808105977e0384F8E5D1a0d33D7'),
            // contract: standariseAddress('0x003d0231d65ec6fa55a28923c365ec4d54b7b1a987620715a56a6dd86d19fbb8')
        }
    })
    let sum = BigInt(0);
    const filtered: any[] = [];
    myInfo.map(m => {
        const c = ProcessedContracts.find(p => standariseAddress(p.contractAddress) === m.contract);
        const amt = BigInt(m.amount);
        sum += amt;
        if (amt > 0) {
            filtered.push({
                ...m,
            })
        }
        console.log({
            tx: m.txHash,
            amt: (Number(amt / BigInt(10**15)) / 1000).toString(),
            block: m.block_number,
        })
        return {
            ...m,
            protocol: c?.protocol,
            amt: (Number(amt / BigInt(10**15)) / 1000).toString()
        }
    })
    // console.log(filtered)
    // console.log(filtered.length);
    console.log('myInfo: ', myInfo.length)
    console.log('sum: ', (sum / BigInt(10**18)).toString())
    
    return;
    const totalSTRKClaimed = await prisma.claims.findMany({
        select: {
            amount: true
        },
    })
    let amountSum = BigInt(0);
    totalSTRKClaimed.forEach(claim => {
        amountSum += BigInt(claim.amount)
    })
    console.log('totalSTRKClaimed: ', amountSum / BigInt(10**18))

    const uniqueUsers = await prisma.claims.findMany({
        distinct: ['claimee'],
        select: {
            claimee: true
        }
    })
    console.log('uniqueUsers: ', uniqueUsers.length)

    const nTxLatestBlock = await prisma.claims.findMany({
        where: {
            block_number: lastBlock?.block_number
        }
    })
    console.log('nTxLatestBlock: ', nTxLatestBlock.length)

    // nTx prev block
    const nTxPrevBlock = await prisma.claims.findMany({
        where: {
            block_number: lastBlock ? lastBlock.block_number - 1 : 0
        }
    })
    console.log('nTxPrevBlock: ', nTxPrevBlock.length)
}

async function nimboraAcc() {
    const prisma = new PrismaClient();

    const lastBlock = await prisma.claims.findFirst({
        where: {
            eventKey: 'NIMBORA-ACC'
        },
        orderBy: {
            block_number: 'desc'
        },
        select: {
            block_number: true
        }
    })
    console.log('lastBlock: ', lastBlock)
    
    const data = await prisma.claims.findMany({
        where: {
            eventKey: 'NIMBORA-ACC'
        },
        distinct: ['contract'],
        select: {
            contract: true
        }
    })
    console.log('unique contracts: ', data.length)

    const myInfo = await prisma.claims.findMany({
        where: {
            claimee: '0x5b55db55f5884856860e63f3595b2ec6b2c9555f3f507b4ca728d8e427b7864',
            eventKey: 'NIMBORA-ACC'
        }
    })
    console.log('myInfo: ', myInfo.length)

    const totalSTRKClaimed = await prisma.claims.findMany({
        where: {
            eventKey: 'NIMBORA-ACC'
        },
        select: {
            amount: true
        }
    })
    let amountSum = BigInt(0);
    totalSTRKClaimed.forEach(claim => {
        amountSum += BigInt(claim.amount)
    })
    console.log('totalSTRKClaimed: ', amountSum / BigInt(10**18))

    const uniqueUsers = await prisma.claims.findMany({
        where: {
            eventKey: 'NIMBORA-ACC'
        },
        distinct: ['claimee'],
        select: {
            claimee: true
        }
    })
    console.log('uniqueUsers: ', uniqueUsers.length)


}

async function deleteAbove() {
    const prisma = new PrismaClient();
    const data = await prisma.claims.deleteMany({
        where: {
            // block_number: {
            //     gt: 1024182,
            // },
            contract: {
                in: NewContracts.map(c => standariseAddress(c.contractAddress))
            }
        }
    })
    console.log('deleted: ', data)
}

async function getContractsNotTrakced() {
    const notTracked: any[] = [];
    const prisma = new PrismaClient();
    for (let i=0; i<ProcessedContracts.length; ++i) {
        console.log(`checking: ${i}/${ProcessedContracts.length}`)
        const addr = ProcessedContracts[i].contractAddress;
        const data = await prisma.claims.count({
            where: {
                contract: standariseAddress(addr)
            }
        })        
        if (data === 0) {
            notTracked.push({
                contractAddress: addr,
                protocol: ProcessedContracts[i].protocol,
                classHash: ProcessedContracts[i].classHash
            })
            console.log('not tracked: ', addr)
        } else {
            console.log(`length: ${data}`)
        }
    }
    console.log('notTracked: ', notTracked);
}

async function getConctractsWithNoClaims() {
    const processed = ProcessedContracts.map(c => standariseAddress(c.contractAddress));
    const prisma = new PrismaClient();
    const data = await prisma.claims.findMany({
        where: {
            contract: {
                in: processed
            }
        },
        distinct: ['contract'],
        select: {
            contract: true
        }
    })
    const missing = processed.filter(p => !data.find(d => d.contract === p));
    console.log('missing: ', missing.map(m => ({
        contractAddress: m,
        classHash: '',
        protocol: ''
    })));
}

async function getEvents() {
  const provider = new RpcProvider({
      nodeUrl: 'https://rpc.unwraplabs.com/rpc/strkfarm/1v3w50m16mkjbx8wqkd1gh6rc4vh59zu',
  });

  const data = await provider.getBlockLatestAccepted();
  console.log('data: ', data);
}

async function getMissingContracts(classHash1: string) {
  const provider = new RpcProvider({
      nodeUrl: 'https://rpc.unwraplabs.com/rpc/strkfarm/1v3w50m16mkjbx8wqkd1gh6rc4vh59zu',
  });

  const strkAddr = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
  const strkClass = await provider.getClassAt(strkAddr);
  const strkContract = new Contract(strkClass.abi, strkAddr, provider);

  const zendToken = '0x00585c32b625999e6e5e78645ff8df7a9001cf5cf3eb6b80ccdd16cb64bd3a34';
  const zendContract = new Contract(strkClass.abi, zendToken, provider);

  let lastPage = 1;
  let page = 1;
  const missingContracts: any[] = [];

  while (page <= lastPage) {
    // const classHash1 = '0x01cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14';
    const data1 = await fetch(`https://voyager.online/api/class/${classHash1}/contracts?ps=100&p=${page}`);
    const dataJson = await data1.json();
    const items = dataJson.items;
    lastPage = dataJson.lastPage;

    console.log('items: ', items.length);
    console.log('lastPage: ', lastPage);
    console.log('page: ', page);
    page++;

    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      const contractAddress = item.address;
      const exists = ProcessedContracts.find(p => standariseAddress(p.contractAddress) === standariseAddress(contractAddress));
      if (!exists) {
          let strkBalanceofContract: any = await strkContract.call('balanceOf', [contractAddress]);
          strkBalanceofContract = BigInt(strkBalanceofContract);
          let zendBalanceofContract: any = await zendContract.call('balanceOf', [contractAddress]);
          zendBalanceofContract = BigInt(zendBalanceofContract);
          if (strkBalanceofContract == 0n && zendBalanceofContract > 0n) {
            continue;
          } else if (strkBalanceofContract == 0n && zendBalanceofContract == 0n) {
            console.log(`Skipping contract with no STRK or ZEND balance: ${contractAddress}`);
            continue;
            // throw new Error(`Skipping contract with no STRK or ZEND balance: ${contractAddress}`);
          } else if (strkBalanceofContract < BigInt(10**20)) {
            console.log(`Skipping contract with low STRK balance: ${contractAddress}`);
            continue;
          }
          missingContracts.push({
              classHash: classHash1,
              contractAddress: standariseAddress(contractAddress),
              protocol: 'Unknown',
              creationTimestamp: new Date(item.creationTimestamp * 1000),
              strkBalance: strkBalanceofContract.toString(),
          });
      }
    }
  }

  console.log('missingContracts: ', missingContracts);
  console.log(`Total missing contracts: ${missingContracts.length}`);
}

async function findMissingClaimTransactions() {
  const user = '0x02D86897DaaDeE2DFFDB5C5B734aB568fE849808105977e0384F8E5D1a0d33D7';
  let page = 1;
  let lastPage = 1;
  const missingTxs: string[] = [];
  const prisma = new PrismaClient();
  const registeredTransactions = await prisma.claims.findMany({
      where: {
          claimee: standariseAddress(user)
      }
  });
  console.log('registeredTransactions: ', registeredTransactions.length);
  while (page <= lastPage) {
    const URL = `https://voyager.online/api/txns?to=${user}&ps=100&p=${page}`;
    const result = await fetch(URL);
    const data = await result.json();
    const items = data.items;
    lastPage = data.lastPage;
    console.log('items: ', items.length);
    console.log('lastPage: ', lastPage);
    console.log('page: ', page);
    page++;

    for (let item of items) {
      const operation = item.operations;
      if (operation == 'claim') {
        const txHash = item.hash;
        const exists = registeredTransactions.find(t => standariseAddress(t.txHash) == standariseAddress(txHash));
        if (!exists) {
          missingTxs.push(txHash);
        }
      }
    }
  }

  console.log('missingTxs: ', missingTxs);
  console.log(`Total missing transactions: ${missingTxs.length}`);
}

async function verifyClaimTxs() {
  const txs = [
    '0x1fc1aa21d775bb22c195130978f11605a0c1c2c8a76a12f44ca494fbfe0e66c',
    '0x6aecd61e10d056ff487ced19638228bb087a92be052a6336622cd5207dd1361',
    '0x13d8cacc831ab5af8fb929c3f02a5df04d66a1c0b0f74c2f9fea3000b14bc4e',
    '0x39b81896c5af44fa8e3dd2e0abc862a34f95f11b64d35aab858a1673368960',
    '0x2d77051fb93c4a83507eac5b0548b3597eba229730cbefdc8cee1b2bd79cad6',
    '0x7d74690c515e9ad4cdda3b4c618ec1dfa92a413d89475501df76175838cfb0e',
    '0x23fe796bcb0e3dfcd3c68315e8834a5880cef9580804a691a2e9e3c2267eaea',
    '0x35bef55e0f892f55743c6f91c883b472824d72ef78596f686b302b58503c873',
    '0x26b1d2fab0a69381cbcd4973916fa6f465ed5d2b52bc07e091ccae1b7df1796',
    '0x44c9dc550de18a6cbd51986685d21f97087f6cd1bd1bbaddc209f74e171dd81',
    '0xa86d587aeba0cc806d9ad61331f50e7f7dab3666bea4c5dab0413b03507ae3',
    '0x73f948fde041e56f463e340d83ec6ef9b4b3088d65ba54a54a9a4c4d7c374bc',
    '0x6dec24782dc94bdae1a4c59b090cb085ebe0b772a8040f5c28367d31f375949',
    '0x1fcb70e2a4d2a6af5a72daf4185d16439bc1554f4d5480e751ae1c84fcf3369',
    '0x6d08dab0aa6bf383eb0f0295fb2e60799da0c8feb6aed695d8e0623f7ba1fd7',
    '0x5a9b00334533594c0789fb62cbdd6de1e2619bdb8e32051914c139347723697',
    '0x6fcf13354ed4d24f23c0e4c0ab14222d1c2edbece6f3bcb3ae63f36a3db533a',
    '0x3162e39fe64b4519d03df106819e27de50f509e2c835789599202cad0be4ae7',
    '0x37bf2a7b817cb54c1d72bc28f2646f200ae9ea951d1364d5bf348c32d0c2f42',
    '0x3a03c3517fb493a34522ac643e2fe1606dfbc4af89cdd88a208e6d84a242e78',
    '0x79b6e559d0d88eb18e9d6c13774fbe737ab71a4b78890a01b3e895e6201bef1',
    '0x7c2e3007afd2a1d88a31bae041b36bb8a9143012a72b27baf6fbc19b2c701cc',
    '0x20f0ac3e016c62740aad66879e185061d4f5b9e8cb9b43dd66d1f96d637195a',
    '0x4c42d1b2244b0d503c0b55e5de43780d2b6ebbfeeb341b3266bb173cf6031d1',
    '0x7c7384b3b76af6d9fb3a2d9e6f60385472dfd10e6cb9cac1937ec170c4f349a',
    '0x20116d858b52d3e2f3834ecaf790ce0b2aefb213f21b77cb6b8c5059a737877',
    '0x3201b9da980fddc1c7a5ff29bb40bcb83eaadb39103186d3f6ff1fc26bac52c',
    '0xd32e65f39d569b7888558a3e1ebb9b8c4ce515ad2edf3a3f71d4086e1062ee',
    '0x6de27748fbf9891be4277a548a7505f5a95260fcfaa05a616a5926a7d5ccfb3'
  ];

  const provider = new RpcProvider({
      nodeUrl: 'https://rpc.unwraplabs.com/rpc/strkfarm/1v3w50m16mkjbx8wqkd1gh6rc4vh59zu',
  });

  const allowedCls = [
    standariseAddress('0x6a54af2934978ac59b27b91291d3da634f161fd5f22a2993da425893c44c64'),
    standariseAddress('0x1cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14')
  ]

  const claimKey = '0x35cc0235f835cc84da50813dc84eb10a75e24a21d74d6d86278c0f037cb7429';
  const filteredTxs: string[] = [];
  for (let tx of txs) {
    const receipt = await provider.getTransactionReceipt(tx) as SuccessfulTransactionReceiptResponse
    for (let event of receipt.events) {
      if (standariseAddress(event.keys[0]) == standariseAddress(claimKey)) {
        console.log(`Found claim event in transaction: ${tx}`);
        const contract = event.from_address;
        const cls = await provider.getClassHashAt(contract);
        if (allowedCls.includes(standariseAddress(cls))) {
          filteredTxs.push(tx);
          console.log(`Filtered transaction: ${tx} with contract: ${contract} and class: ${cls}`);
        } else {
          console.log(`Skipping transaction: ${tx} with contract: ${contract} and class: ${cls}`);
        }
      } else {
        console.log(`No claim event in transaction: ${tx}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // to avoid rate limiting
  }
}

if (require.main === module) {
    // async function runBulk() {
    //     const addresses: string[] = [];
    //     const prisma = new PrismaClient();

    //     const data = await prisma.claims.findMany({
    //         wh
    //     })
    // }
    // run()
    // getEvents();
    // getMissingContracts('0x1cb5e128a81be492ee7b78cf4ba4849cb35f311508e13a558755f4549839f14');
    // findMissingClaimTransactions();
    verifyClaimTxs();
    // getConctractsWithNoClaims();
    // nimboraAcc()
    // getContractsNotTrakced();
    // deleteAbove();
}