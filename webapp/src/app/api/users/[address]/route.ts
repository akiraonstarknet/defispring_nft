import { NextResponse } from "next/server";
import IntractUsers from '@public/intractusers.json';
import { ec, hash, num } from "starknet";
import { LEVELS, isIntractUser } from "@/utils";
import BigNumber from "bignumber.js";
import {Connection} from 'postgresql-client';
import { getConnection } from "../../utils";

export const revalidate = 0;

function standariseAddress(address: string | bigint) {
    return num.getHexString(num.getDecimalString(address.toString()));
}

const tenPow18 = new BigNumber(10).pow(18);

export async function GET(req: Request, context: any) {
    let connection: Connection | null = null;
    try {
        connection = await getConnection();

        const { params } = context;
        const addr = params.address;

        // standardised address
        let pAddr = addr;
        try {
            pAddr = standariseAddress(addr);
        } catch (e) {
            throw new Error('Invalid address');
        }

        const mocks = {
            l0: [
                standariseAddress('0x0546EDeAf1f31e30F9B5dC88eD638e62F38992A18d4bc61B5A4351546CeeFAbd'), // damian
            ],
            l1: [
                standariseAddress('0x044B69c21c81220D8F635526aaC87083a692c9228A30471727d190924AAF4Ed0'), // damian
            ],
            l2: [
                standariseAddress('0x06738C94e72c19F2EEA8deb5E6e9ab8dFecFb462dC6906E6542A30BF179594ef'), // damian
                standariseAddress('0x061ac458892A156336b6E297742b28Da072d033F2D4Ad7880ec9CBE2194be9bc'), // roberto
            ],
            l3: [
                standariseAddress('0x07c35c66a72965f2e1d1714f25bba835794D7FEf57eceC333574e311014B5746'), // damian
                standariseAddress('0x00C7AC19CE4fDF6Ec88e4EabFF44Abebf66E4Ff1Db4F1FCAd0a71D11C1e1815B'), // roberto
            ],
            l4: [
                standariseAddress('0x03a22a9e61d2edcefd604c3a7dc2a57d7629f4321537243e7682fe7fa07546c5'), // akira
                standariseAddress('0x07bD5c57173EeADd4511D5563b209cd011425cbfB0301DB4646F76CBB21c908F'), // damian
                standariseAddress('0x04384cFc98Eb8f45D64A122D2A247D4fb494D88BD588D1bfE06E6183107C734F'), // roberto
            ]
        }

        const interactMocks = {
            l0: [
                standariseAddress('0x0581C97C285eb3b467E193713A97CabD51fd23f976D3982aF10Ab941A0E85360'), // damian
            ],
            l1: [
                standariseAddress('0x0239e533E9E8675f9520bD485100558a9e5163a6830Ea43C96de5109AFc78C6a'), // damian
                standariseAddress('0x00c7b2cE0E4D25544c21f4c7F9A4331EFb205A0e6f6eC8474ca65C436484E85d'), // roberto
            ],
            l2: [
                standariseAddress('0x048eDAac7E8e21944b328ca61719c5A9DCAC85436632491A990Dd2D40D518135'), // damian
            ],
            l3: [
                standariseAddress('0x04309a532DAd66E93B1ec02b70dF60146055265DD32dC4C7945deec4DA03b9e6'), // damian
                standariseAddress('0x03495DD1e4838aa06666aac236036D86E81A6553e222FC02e70C2Cbc0062e8d0'), // roberto
            ],
            l4: [
                "0x5af1e8df8d237cb76493f8305063674496f945c0ed98d5be45dede299c31f99", // akira
                standariseAddress('0x020917F162FEcAE3DF545e965a3f09F8Cd15B6e2aa37483bB6FAFEeF4f14aDD7'), // damian
            ]
        }
        // test TODO remove before commit
        let queryAddr = pAddr;
        if (addr == '0x5af1e8df8d237cb76493f8305063674496f945c0ed98d5be45dede299c31f99') {
            queryAddr = '0x5b55db55f5884856860e63f3595b2ec6b2c9555f3f507b4ca728d8e427b7864'
        }
        
        if(!process.env.ACCOUNT_PK) {
            throw new Error('Invalid signer');
        }

        const result = await connection.query(
            `select claimee, amount from claims where claimee='${queryAddr}'`);
        
        let strkAmount = new BigNumber(0);
        if(result.rows) {
            const rows: any[] = result.rows;
            console.log('rows', queryAddr, rows);
            rows.forEach(row => {
                strkAmount = strkAmount.plus(row[1]);
            }) 
        } else {
            console.log('noData', {
                queryAddr
            })
        }

        let isInteractUser = (<any>IntractUsers)[pAddr] ? true : false;

        // mocks
        console.log('pAddr', pAddr, mocks.l4.includes(pAddr))
        if (mocks.l1.includes(pAddr)) {
            strkAmount = new BigNumber(LEVELS[0].amountSTRK).multipliedBy(tenPow18);
            isInteractUser = false;
        } else if(mocks.l2.includes(pAddr)) {
            strkAmount = new BigNumber(LEVELS[1].amountSTRK).multipliedBy(tenPow18);
            isInteractUser = false;
        } else if (mocks.l3.includes(pAddr)) {
            strkAmount = new BigNumber(LEVELS[2].amountSTRK).multipliedBy(tenPow18);
            isInteractUser = false;
        } else if (mocks.l4.includes(pAddr)) {
            strkAmount = new BigNumber(LEVELS[3].amountSTRK).multipliedBy(tenPow18);
            isInteractUser = false;
        } else if (mocks.l0.includes(pAddr)) {
            strkAmount = new BigNumber(0);
            isInteractUser = false;
        }

        if (interactMocks.l1.includes(pAddr)) {
            strkAmount = new BigNumber(LEVELS[0].amountSTRK).multipliedBy(tenPow18);
            isInteractUser = true;
        } else if(interactMocks.l2.includes(pAddr)) {
            strkAmount = new BigNumber(LEVELS[1].amountSTRK).multipliedBy(tenPow18);
            isInteractUser = true;
        } else if (interactMocks.l3.includes(pAddr)) {
            strkAmount = new BigNumber(LEVELS[2].amountSTRK).multipliedBy(tenPow18);
            isInteractUser = true;
        } else if (interactMocks.l4.includes(pAddr)) {
            strkAmount = new BigNumber(LEVELS[3].amountSTRK).multipliedBy(tenPow18);
            isInteractUser = true;
        } else if (interactMocks.l0.includes(pAddr)) {
            strkAmount = new BigNumber(0);
            isInteractUser = true;
        }

        // this allows to sign a sig that allows user to mint upto level 2 NFT
        // without STRK
        let signStrkAmount = strkAmount;
        if (isInteractUser && strkAmount.lt(new BigNumber(LEVELS[1].amountSTRK).multipliedBy(tenPow18))) {
            signStrkAmount = new BigNumber(LEVELS[1].amountSTRK * (10 ** 18));
        }
        
        console.log('pAddr info', {
            signStrkAmount: signStrkAmount.toFixed(0),
            strkAmount: strkAmount.toFixed(0),
            isIntractUser: isInteractUser
        })
        const hash1 = hash.computePedersenHash(pAddr, signStrkAmount.toFixed(0));
            
        const sig = ec.starkCurve.sign(hash1, process.env.ACCOUNT_PK);

        connection.close();
        return NextResponse.json({
            address: pAddr,
            isIntractUser: isInteractUser,
            strkEarned: strkAmount.toFixed(),
            signStrkAmount: signStrkAmount.toFixed(),
            hash: hash1,
            sig: [sig.r.toString(), sig.s.toString()] 
        })
    } catch(err) {
        console.error('Error /api/users/:address', err);
        if (connection)
            connection.close();
        return NextResponse.json({
            address: '',
            isIntractUser: false,
            strkEarned: '0',
            signStrkAmount: '0',
            hash: '',
            sig: [] 
        }, {
            status: 500
        })
    }
}