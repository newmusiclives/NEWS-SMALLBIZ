import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'smallbiz.db');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BetterSqlite3: any = null;
try {
  // Use dynamic string to prevent webpack from resolving this at build time
  const moduleName = 'better-sqlite3';
  BetterSqlite3 = require(moduleName);
} catch {
  // Native module not available (e.g. Netlify serverless)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any = null;

export interface Business {
  id: string;
  name: string;
  business_type: string;
  address: string | null;
  city: string | null;
  region_id: string;
  region_name: string;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  review_count: number;
  source: string;
  discovered_at: string;
  updated_at: string;
  is_new: number;
  has_newsletter: number;
  newsletter_signals: string | null;
  events_url: string | null;
}

export interface Schedule {
  id: string;
  name: string;
  region_ids: string;
  business_type_ids: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  max_per_region: number;
  is_active: number;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  run_history: string;
}

export interface RegionSummary {
  regionId: string;
  regionName: string;
  country: string;
  businessCount: number;
  lastUpdated: string | null;
}

export interface BusinessFilters {
  regionId?: string;
  businessType?: string;
  search?: string;
  newOnly?: boolean;
  limit?: number;
  offset?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTables(db: any): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      address TEXT,
      city TEXT,
      region_id TEXT NOT NULL,
      region_name TEXT NOT NULL,
      country TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      website TEXT,
      rating REAL,
      review_count INTEGER DEFAULT 0,
      source TEXT DEFAULT 'google',
      discovered_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_new INTEGER DEFAULT 1,
      has_newsletter INTEGER DEFAULT 0,
      newsletter_signals TEXT,
      events_url TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_unique
      ON businesses(name, address, region_id);

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region_ids TEXT NOT NULL,
      business_type_ids TEXT NOT NULL,
      frequency TEXT NOT NULL,
      max_per_region INTEGER DEFAULT 200,
      is_active INTEGER DEFAULT 1,
      last_run TEXT,
      next_run TEXT,
      created_at TEXT NOT NULL,
      run_history TEXT DEFAULT '[]'
    );
  `);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateTables(db: any): void {
  // Add newsletter columns if they don't exist (for existing databases)
  const cols = db.prepare("PRAGMA table_info(businesses)").all() as { name: string }[];
  const colNames = cols.map((c) => c.name);
  if (!colNames.includes('has_newsletter')) {
    db.exec('ALTER TABLE businesses ADD COLUMN has_newsletter INTEGER DEFAULT 0');
  }
  if (!colNames.includes('newsletter_signals')) {
    db.exec('ALTER TABLE businesses ADD COLUMN newsletter_signals TEXT');
  }
  if (!colNames.includes('events_url')) {
    db.exec('ALTER TABLE businesses ADD COLUMN events_url TEXT');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
  if (dbInstance) return dbInstance;

  if (!BetterSqlite3) {
    throw new Error('Database not available in this environment');
  }

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new BetterSqlite3(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');
  createTables(dbInstance);
  migrateTables(dbInstance);
  return dbInstance;
}

export function insertBusiness(biz: {
  name: string;
  businessType: string;
  address?: string;
  city?: string;
  regionId: string;
  regionName: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number | null;
  reviewCount?: number;
  source?: string;
  hasNewsletter?: boolean;
  newsletterSignals?: string[];
  eventsUrl?: string;
}): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO businesses
      (id, name, business_type, address, city, region_id, region_name, country,
       phone, email, website, rating, review_count, source, discovered_at, updated_at, is_new,
       has_newsletter, newsletter_signals, events_url)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  const result = stmt.run(
    id,
    biz.name,
    biz.businessType,
    biz.address ?? null,
    biz.city ?? null,
    biz.regionId,
    biz.regionName,
    biz.country,
    biz.phone ?? null,
    biz.email ?? null,
    biz.website ?? null,
    biz.rating ?? null,
    biz.reviewCount ?? 0,
    biz.source ?? 'google',
    now,
    now,
    biz.hasNewsletter ? 1 : 0,
    biz.newsletterSignals ? JSON.stringify(biz.newsletterSignals) : null,
    biz.eventsUrl ?? null,
  );

  return result.changes > 0;
}

export function getBusinesses(filters: BusinessFilters = {}): Business[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.regionId) {
    conditions.push('region_id = ?');
    params.push(filters.regionId);
  }
  if (filters.businessType) {
    conditions.push('business_type = ?');
    params.push(filters.businessType);
  }
  if (filters.search) {
    conditions.push('(name LIKE ? OR address LIKE ? OR city LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }
  if (filters.newOnly) {
    conditions.push('is_new = 1');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  const stmt = db.prepare(
    `SELECT * FROM businesses ${where} ORDER BY discovered_at DESC LIMIT ? OFFSET ?`
  );
  params.push(limit, offset);

  return stmt.all(...params) as Business[];
}

export function getBusinessCount(regionId?: string, businessType?: string): number {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (regionId) {
    conditions.push('region_id = ?');
    params.push(regionId);
  }
  if (businessType) {
    conditions.push('business_type = ?');
    params.push(businessType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM businesses ${where}`);
  const row = stmt.get(...params) as { count: number };
  return row.count;
}

export function getRegionSummaries(): RegionSummary[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      region_id as regionId,
      region_name as regionName,
      country,
      COUNT(*) as businessCount,
      MAX(updated_at) as lastUpdated
    FROM businesses
    GROUP BY region_id
    ORDER BY region_name ASC
  `);
  return stmt.all() as RegionSummary[];
}

export interface BusinessTypeSummary {
  businessType: string;
  count: number;
}

export function getBusinessTypeSummaries(): BusinessTypeSummary[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      business_type as businessType,
      COUNT(*) as count
    FROM businesses
    GROUP BY business_type
    ORDER BY count DESC
  `);
  return stmt.all() as BusinessTypeSummary[];
}

export function getBusinessTypesForRegion(regionId: string): BusinessTypeSummary[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      business_type as businessType,
      COUNT(*) as count
    FROM businesses
    WHERE region_id = ?
    GROUP BY business_type
    ORDER BY count DESC
  `);
  return stmt.all(regionId) as BusinessTypeSummary[];
}

export function clearRegion(regionId: string): number {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM businesses WHERE region_id = ?');
  const result = stmt.run(regionId);
  return result.changes;
}

export function clearAll(): number {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM businesses');
  const result = stmt.run();
  return result.changes;
}

export function markAllNotNew(): number {
  const db = getDb();
  const stmt = db.prepare('UPDATE businesses SET is_new = 0');
  const result = stmt.run();
  return result.changes;
}

export function getNewBusinesses(): Business[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM businesses WHERE is_new = 1 ORDER BY discovered_at DESC');
  return stmt.all() as Business[];
}

export function createSchedule(schedule: {
  name: string;
  regionIds: string[];
  businessTypeIds: string[];
  frequency: 'weekly' | 'biweekly' | 'monthly';
  maxPerRegion?: number;
  nextRun?: string;
}): Schedule {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO schedules
      (id, name, region_ids, business_type_ids, frequency, max_per_region,
       is_active, last_run, next_run, created_at, run_history)
    VALUES (?, ?, ?, ?, ?, ?, 1, NULL, ?, ?, '[]')
  `);

  stmt.run(
    id,
    schedule.name,
    JSON.stringify(schedule.regionIds),
    JSON.stringify(schedule.businessTypeIds),
    schedule.frequency,
    schedule.maxPerRegion ?? 200,
    schedule.nextRun ?? null,
    now,
  );

  return getDb().prepare('SELECT * FROM schedules WHERE id = ?').get(id) as Schedule;
}

export function getSchedules(): Schedule[] {
  const db = getDb();
  return db.prepare('SELECT * FROM schedules ORDER BY created_at DESC').all() as Schedule[];
}

export function updateSchedule(
  id: string,
  updates: Partial<{
    name: string;
    regionIds: string[];
    businessTypeIds: string[];
    frequency: string;
    maxPerRegion: number;
    isActive: number;
    lastRun: string;
    nextRun: string;
    runHistory: unknown[];
  }>
): boolean {
  const db = getDb();
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    params.push(updates.name);
  }
  if (updates.regionIds !== undefined) {
    setClauses.push('region_ids = ?');
    params.push(JSON.stringify(updates.regionIds));
  }
  if (updates.businessTypeIds !== undefined) {
    setClauses.push('business_type_ids = ?');
    params.push(JSON.stringify(updates.businessTypeIds));
  }
  if (updates.frequency !== undefined) {
    setClauses.push('frequency = ?');
    params.push(updates.frequency);
  }
  if (updates.maxPerRegion !== undefined) {
    setClauses.push('max_per_region = ?');
    params.push(updates.maxPerRegion);
  }
  if (updates.isActive !== undefined) {
    setClauses.push('is_active = ?');
    params.push(updates.isActive);
  }
  if (updates.lastRun !== undefined) {
    setClauses.push('last_run = ?');
    params.push(updates.lastRun);
  }
  if (updates.nextRun !== undefined) {
    setClauses.push('next_run = ?');
    params.push(updates.nextRun);
  }
  if (updates.runHistory !== undefined) {
    setClauses.push('run_history = ?');
    params.push(JSON.stringify(updates.runHistory));
  }

  if (setClauses.length === 0) return false;

  params.push(id);
  const stmt = db.prepare(`UPDATE schedules SET ${setClauses.join(', ')} WHERE id = ?`);
  const result = stmt.run(...params);
  return result.changes > 0;
}

export function deleteSchedule(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
