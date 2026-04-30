import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema/index.js'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = join(fileURLToPath(import.meta.url), '..')
const dbPath = join(__dirname, '..', '..', 'data', 'minijira.db')

const sqliteDb = new Database(dbPath)
sqliteDb.pragma('journal_mode = WAL')

export const db = drizzle(sqliteDb, { schema })

export type Database = ReturnType<typeof drizzle>
