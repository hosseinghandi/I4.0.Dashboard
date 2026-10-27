// @ts-ignore Node.js types are provided by the supported runtime.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
// @ts-ignore node:sqlite is provided by the supported Node.js runtime.
import { DatabaseSync } from 'node:sqlite';
export function openDatabase(dataDirectory) {
    const databaseDirectory = path.join(dataDirectory, 'databases');
    mkdirSync(databaseDirectory, { recursive: true });
    const database = new DatabaseSync(path.join(databaseDirectory, 'production-articles.sqlite'));
    database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS production_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL COLLATE NOCASE UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS production_article_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      production_article_id INTEGER NOT NULL REFERENCES production_articles(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      machine_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'working', 'finished', 'error')),
      message TEXT NOT NULL DEFAULT '',
      dispatched_at TEXT,
      started_at TEXT,
      finished_at TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (production_article_id, machine_id)
    );
    CREATE INDEX IF NOT EXISTS production_article_steps_article_idx
      ON production_article_steps(production_article_id, position);
  `);
    // Databases created before machine tracking lack this column.
    const columns = database.prepare('PRAGMA table_info(production_article_steps)').all();
    if (!columns.some((column) => column.name === 'dispatched_at')) {
        database.exec('ALTER TABLE production_article_steps ADD COLUMN dispatched_at TEXT');
    }
    return database;
}
