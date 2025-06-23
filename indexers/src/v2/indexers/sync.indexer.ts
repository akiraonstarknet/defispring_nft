import { defineIndexer } from "@apibara/indexer";
import { StarknetStream } from "@apibara/starknet";

import { useLogger } from "@apibara/indexer/plugins";
import { drizzleStorage } from "@apibara/plugin-drizzle";
import { claims } from "@prisma/client";
import type { ApibaraRuntimeConfig } from "apibara/types";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./drizzle/schema";
import { getDB, standardise, toHex } from "./utils";
import { newContracts } from './contracts';

// USDC Transfers on Starknet
export default function (runtimeConfig: ApibaraRuntimeConfig) {
  return createIndexer({
    database: getDB(process.env.POSTGRES_CONNECTION_STRING!),
    config: runtimeConfig,
  });
}

// Add all contracts to monitor for events into the filter
const CONTRACTS = Object.keys(newContracts).map(category => {
  return newContracts[category].contracts.map(c => {
      return c.address
  })
}).flat();

// ! REMEMBER TO UPDATE THIS ON EACH SYNC
const MAX_BLOCK = 1513766;

export function createIndexer<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>
>({
  database,
  config,
}: {
  database: PgDatabase<TQueryResult, TFullSchema, TSchema>;
  config: ApibaraRuntimeConfig;
}) {
  return defineIndexer(StarknetStream)({
    streamUrl: "https://mainnet.starknet.a5a.ch",
    finality: "accepted",
    startingBlock: 1370000n, // ! REMEMBER TO UPDATE THIS ON EACH SYNC
    plugins: [
      drizzleStorage({
        db: database,
        idColumn: "id",
        persistState: true,
        indexerName: "sync.indexer2",
      }),
    ],
    filter: {
      events: [{
        address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
        keys: ["0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9"]
      }],
      header: 'always'
    },
    async transform({ endCursor, block, context, finality }) {
      const logger = useLogger();
      const { events, header } = block;
      if (!header.blockNumber) {
        return;
      } else if (header.blockNumber > MAX_BLOCK) {
        return;
      }

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality
      );

      const records: Omit<claims, 'cursor' | 'id'>[] = [];

      for (const event of events) {
        const key = standardise(event.keys[0]);
        if (key != '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9') {
          logger.log(`Skipping event with key: ${key} with txHash: ${event.transactionHash}, eventIndex: ${event.eventIndex}`);
          continue;
        }

        const claimInfo = {
            from: toHex(event.data[0]),
            claimee: toHex(event.data[1]),
            amount: BigInt(event.data[2]),
            eventKey: 'Transfer'
        };

        if (!CONTRACTS.includes(claimInfo.from)) {
          continue;
        }

        const claim: Omit<claims, 'cursor' | 'id'> = {
            block_number: Number(header.blockNumber),
            txHash: standardise(event.transactionHash),
            txIndex: Number(event.transactionIndex),
            eventIndex: Number(event.eventIndex),
            contract: claimInfo.from,
            claimee: claimInfo.claimee,
            amount:claimInfo.amount.toString(),
            eventKey: claimInfo.eventKey,
            timestamp: Math.round(header.timestamp.getTime() / 1000),
        };
        logger.info(
          `Starknet: Saving record: ${JSON.stringify(claim)}`
        );
        // records.push(claim);
      }

      if (records.length) {
        logger.log(`Inserting ${records.length} records`);
        await database
          .insert(schema.claims)
          .values(records)
          .execute()
      }
    },
  });
}