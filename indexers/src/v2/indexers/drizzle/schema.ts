import { bigint, integer, pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core'

export const claims = pgTable('claims', {
	id: serial('id').notNull().primaryKey(),
	block_number: integer('block_number').notNull(),
	txIndex: integer('txIndex').notNull(),
	eventIndex: integer('eventIndex').notNull(),
	txHash: text('txHash').notNull(),
	eventKey: text('eventKey').notNull(),
	contract: text('contract').notNull(),
	claimee: text('claimee').notNull(),
	amount: text('amount').notNull(),
	timestamp: integer('timestamp').notNull(),
	cursor: bigint('_cursor', { mode: 'bigint' })
}, (claims) => ({
	'event_id': uniqueIndex('event_id')
		.on(claims.block_number, claims.txIndex, claims.eventIndex)
}));