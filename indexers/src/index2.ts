import * as dotenv from 'dotenv';
dotenv.config();
import { StreamClient } from "@apibara/protocol";
import { FieldElement, Filter, StarkNetCursor, v1alpha2 } from "@apibara/starknet";

async function main() {
  const client = new StreamClient({
    url: "mainnet.starknet.a5a.ch",
    token: process.env.DNA_AUTH_TOKEN,
    async onReconnect(err, retryCount) {
      console.log("reconnect", err, retryCount);
      // Sleep for 1 second before retrying.
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { reconnect: true };
    }
  })

  const filter = Filter.create().addEvent((e) => {
    const address = FieldElement.fromBigInt(BigInt('0x054ead9cbb7c140dd4f653aaad1f935ba8f8c002a2b8afea77793fdf8d1d80d3'));
    const key = FieldElement.fromBigInt(
        BigInt(
          "0x35cc0235f835cc84da50813dc84eb10a75e24a21d74d6d86278c0f037cb7429",
        ),
    );
    return e.withFromAddress(address).withKeys([key]).withIncludeReceipt(false).withIncludeReverted(false).withIncludeTransaction(true)
  }).addEvent((e) => {
    const address = FieldElement.fromBigInt(BigInt('0x00dc347ea9e7dc2a307e853b97e7189dfb08679a98e8d5ba549a1872febf2e5d'));
    const key = FieldElement.fromBigInt(
        BigInt(
          "0x35cc0235f835cc84da50813dc84eb10a75e24a21d74d6d86278c0f037cb7429",
        ),
    );
    return e.withFromAddress(address).withKeys([key]).withIncludeReceipt(false).withIncludeReverted(false).withIncludeTransaction(true)
}).withHeader({ weak: false }).encode();

  client.configure({
    filter,
    batchSize: 1,
    // cursor: StarkNetCursor.createWithBlockNumber(574_604),
    cursor: StarkNetCursor.createWithBlockNumber(
      630084)
  })

  for await (const message of client) {
    switch (message.message) {
      case "data": {
        if (!message.data?.data) {
          continue;
        }
        for (const data of message.data.data) {
          const block = v1alpha2.Block.decode(data);
          const { header, events, transactions } = block;
          if (!header || !transactions) {
            continue;
          }
        //   console.log("Block " + header.blockNumber);
        //   console.log(header)
        //   console.log("Events", events.length);

          for (const event of events) {
            console.log(event.event?.data);
            if (event.event && event.transaction) {
                if (event.transaction.meta?.transactionIndex) {
                    const txIndex = event.transaction.meta?.transactionIndex.toString();
                    console.log('txIndex', txIndex)
                }
                if (event.event.index) {
                    const txIndex = event.event.index.toString();
                    console.log('eventIndex', txIndex)
                }
                if (event.event.fromAddress) 
                    console.log("addr", FieldElement.toHex(event.event.fromAddress))
                // if (event.receipt.)
            }
          }
        }
        break;
      }
      case "invalidate": {
        break;
      }
      case "heartbeat": {
        console.log("Received heartbeat");
        break;
      }
    }
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});