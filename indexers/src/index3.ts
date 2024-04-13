import { Cursor, StreamClient } from "@apibara/protocol";
import * as dotenv from 'dotenv';
dotenv.config();
import {
  StarkNetCursor,
  v1alpha2,
} from "@apibara/starknet";
dotenv.config();
import { config as myConfig, eventProcessor } from "@/indexer";
import { validateEnv } from "@/utils";

async function main() {
    validateEnv();

  try {
    // Apibara streaming
    const client = new StreamClient({
      url: "mainnet.starknet.a5a.ch",
      token: process.env.DNA_AUTH_TOKEN,
      async onReconnect(err, retryCount) {
        console.log("reconnect", err, retryCount);
        // Sleep for 1 second before retrying.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return { reconnect: true };
      },
    });

    // Configure the apibara client
    client.configure({
      ...myConfig,
      batchSize: 1,
      cursor: StarkNetCursor.createWithBlockNumber(Number(process.env.START_BLOCK)),
    });

    // Start listening to messages
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
            console.log("Block " + header.blockNumber);
            console.log("Events", events.length);

            const _processedData = eventProcessor(block)
            console.log(_processedData)
            Cursor.createWithOrderKey()
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
  } catch (error) {
    console.error("Initialization failed", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
