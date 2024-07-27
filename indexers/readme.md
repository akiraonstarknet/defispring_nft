# APIbara Indexer to read STRK claims

Requirements:
1. apibara cli
2. Node 20+
3. Recommended package manager: yarn

### Install
`yarn`

### Development
1. Copy .env.sample to .env and configure it

2. Run: `apibara run --allow-env=.env src/indexer.ts -A dna_xxx --sink-id 1`
sink-id can be anything, but use same always

### Sync
1. Run processContracts.ts
2. Shut indexer, Check last processed block and update sync.ts blocks
3. Update index id from package.json
4. Run sync indexer
5. restart main indexe