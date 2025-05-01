import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// ... existing schema definitions

// Schema for Blossom servers
export const blossomServers = pgTable('blossom_servers', {
  id: text('id').primaryKey(),
  serverName: text('server_name').notNull(),
  region: text('region').notNull(),
  tier: text('tier').notNull(),
  userPubkey: text('user_pubkey').notNull(),
  status: text('status').notNull().default('AWAITING_PAYMENT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deployedAt: timestamp('deployed_at'),
  paymentAddress: text('payment_address'),
  paymentAmount: text('payment_amount'),
  instanceId: text('instance_id'),
  publicIp: text('public_ip'),
  publicDnsName: text('public_dns_name'),
  url: text('url'),
  storageUsed: integer('storage_used').default(0),
  storageLimit: integer('storage_limit').notNull().default(5000000000), // 5GB default storage limit
  isActive: boolean('is_active').default(true),
  lastChecked: timestamp('last_checked'),
  lastBackup: timestamp('last_backup'),
  notes: text('notes'),
  // Payment reference
  invoiceId: text('invoice_id'),
});

// Schema for Blossom server backups
export const blossomBackups = pgTable('blossom_backups', {
  id: text('id').primaryKey(),
  serverId: text('server_id').notNull().references(() => blossomServers.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  status: text('status').notNull(),
  size: integer('size').default(0),
  location: text('location'),
  notes: text('notes')
});

// Schema for payment invoices
export const paymentInvoices = pgTable('payment_invoices', {
  id: text('id').primaryKey(), // Bitvora invoice ID
  serverId: text('server_id').notNull().references(() => blossomServers.id),
  amount: text('amount').notNull(), // Using text to avoid float precision issues with BTC
  currency: text('currency').notNull().default('BTC'),
  status: text('status').notNull().default('pending'),
  paymentUrl: text('payment_url'),
  btcAddress: text('btc_address'),
  lightningInvoice: text('lightning_invoice'),
  expiresAt: timestamp('expires_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: text('metadata'), // JSON string of additional metadata
});

// Schema for payment transactions
export const paymentTransactions = pgTable('payment_transactions', {
  id: text('id').primaryKey(), // Bitvora transaction ID
  invoiceId: text('invoice_id').notNull().references(() => paymentInvoices.id),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(),
  txHash: text('tx_hash'), // Blockchain transaction hash
  confirmations: integer('confirmations').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}); 