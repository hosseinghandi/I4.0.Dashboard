import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export function openDatabase(dataDirectory: string): DatabaseSync {
  const databaseDirectory = path.join(dataDirectory, 'databases')
  mkdirSync(databaseDirectory, { recursive: true })
  const database = new DatabaseSync(path.join(databaseDirectory, 'production-articles.sqlite'))

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
  `)

  // Databases created before machine tracking lack this column.
  const columns = database.prepare('PRAGMA table_info(production_article_steps)').all() as unknown as { name: string }[]
  if (!columns.some((column) => column.name === 'dispatched_at')) {
    database.exec('ALTER TABLE production_article_steps ADD COLUMN dispatched_at TEXT')
  }

  // Seed initial mock articles if table is empty
  const countRow = database.prepare('SELECT COUNT(*) as count FROM production_articles').get() as { count: number }
  if (countRow.count === 0) {
    seedDefaultArticles(database)
  }

  return database
}

function seedDefaultArticles(database: DatabaseSync) {
  const now = new Date()
  const formatTime = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)

  const insertArticle = database.prepare(
    'INSERT INTO production_articles (code, description, quantity, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const insertStep = database.prepare(
    `INSERT INTO production_article_steps
     (production_article_id, position, machine_id, status, message, dispatched_at, started_at, finished_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  const articles = [
    {
      code: 'ART-2026-X84',
      description: 'Albero di trasmissione rettificato Ø45mm H7',
      quantity: 120,
      notes: 'Tolleranza geometrica ristretta ±0.005mm. Controllare rugosità superficiale Ra 0.4 dopo rettifica Delta.',
      createdAt: formatTime(180),
      updatedAt: formatTime(5),
      steps: [
        {
          machineId: 'mikron',
          position: 1,
          status: 'finished',
          message: 'Fresatura sgrossatura e finitura completata (120/120)',
          dispatchedAt: formatTime(175),
          startedAt: formatTime(170),
          finishedAt: formatTime(60),
          updatedAt: formatTime(60),
        },
        {
          machineId: 'delta',
          position: 2,
          status: 'working',
          message: 'In lavorazione — pezzi rettificati: 48/120',
          dispatchedAt: formatTime(50),
          startedAt: formatTime(45),
          finishedAt: null,
          updatedAt: formatTime(5),
        },
        {
          machineId: 'qgrind',
          position: 3,
          status: 'pending',
          message: 'In attesa del completamento fase Delta',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: formatTime(5),
        },
        {
          machineId: 'zeiss',
          position: 4,
          status: 'pending',
          message: 'Controllo dimensionale e coassialità CMM programmato',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: formatTime(5),
        },
      ],
    },
    {
      code: 'ART-2026-K12',
      description: 'Ingranaggio cilindrico elicoidale M2.5 Z38',
      quantity: 85,
      notes: 'Trattamento termico di tempra a induzione eseguito. Rettifica dentatura di precisione su mola diamantata.',
      createdAt: formatTime(240),
      updatedAt: formatTime(12),
      steps: [
        {
          machineId: 'mikron',
          position: 1,
          status: 'finished',
          message: 'Sbozzatura e dentatura iniziale completata (85/85)',
          dispatchedAt: formatTime(230),
          startedAt: formatTime(220),
          finishedAt: formatTime(80),
          updatedAt: formatTime(80),
        },
        {
          machineId: 'qgrind',
          position: 2,
          status: 'working',
          message: 'In lavorazione (Execution: ACTIVE) — pezzi: 22/85',
          dispatchedAt: formatTime(75),
          startedAt: formatTime(70),
          finishedAt: null,
          updatedAt: formatTime(12),
        },
        {
          machineId: 'zeiss',
          position: 3,
          status: 'pending',
          message: 'Verifica profilo evolvente e errore di passo al CMM',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: formatTime(12),
        },
      ],
    },
    {
      code: 'ART-2026-P09',
      description: 'Flangia di raccordo alta pressione ISO 6162',
      quantity: 250,
      notes: 'Materiale AISI 316L bonificato. Marcatura laser lotto richiesta su bordo frontale esterno.',
      createdAt: formatTime(120),
      updatedAt: formatTime(30),
      steps: [
        {
          machineId: 'delta',
          position: 1,
          status: 'pending',
          message: 'In coda: in attesa del completamento del lotto precedente sulla macchina',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: formatTime(30),
        },
        {
          machineId: 'zeiss',
          position: 2,
          status: 'pending',
          message: 'Controllo tenuta e planarità superficie flangia',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: formatTime(30),
        },
      ],
    },
    {
      code: 'ART-2026-M47',
      description: 'Boccola di scorrimento bimetallica autolubrificante',
      quantity: 500,
      notes: 'Lotto esportazione per impianto idraulico. Certificato 3.1 EN 10204 allegato al fascicolo di collaudo.',
      createdAt: formatTime(90),
      updatedAt: formatTime(25),
      steps: [
        {
          machineId: 'mikron',
          position: 1,
          status: 'pending',
          message: 'Lavorazione programmata nel prossimo turno',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: formatTime(25),
        },
        {
          machineId: 'delta',
          position: 2,
          status: 'pending',
          message: 'Rettifica diametro interno di precisione H6',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: formatTime(25),
        },
        {
          machineId: 'zeiss',
          position: 3,
          status: 'pending',
          message: 'Campionamento statistico AQL 1.0',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: formatTime(25),
        },
      ],
    },
    {
      code: 'ART-2026-C03',
      description: 'Perno di centraggio temprato e rettificato Ø20 h6',
      quantity: 300,
      notes: 'Collaudo superato con esito 100% conforme. Lotto pronto per spedizione protetta in carta VCI.',
      createdAt: formatTime(400),
      updatedAt: formatTime(65),
      steps: [
        {
          machineId: 'mikron',
          position: 1,
          status: 'finished',
          message: 'Tornitura e foratura centraggio eseguita',
          dispatchedAt: formatTime(390),
          startedAt: formatTime(380),
          finishedAt: formatTime(210),
          updatedAt: formatTime(210),
        },
        {
          machineId: 'delta',
          position: 2,
          status: 'finished',
          message: 'Rettifica diametro esterno terminata (300/300)',
          dispatchedAt: formatTime(200),
          startedAt: formatTime(190),
          finishedAt: formatTime(90),
          updatedAt: formatTime(90),
        },
        {
          machineId: 'zeiss',
          position: 3,
          status: 'finished',
          message: 'Certificato CMM emesso: rugosità Ra 0.22, concentricità 0.002mm',
          dispatchedAt: formatTime(85),
          startedAt: formatTime(80),
          finishedAt: formatTime(65),
          updatedAt: formatTime(65),
        },
      ],
    },
  ]

  database.exec('BEGIN IMMEDIATE')
  try {
    for (const art of articles) {
      const res = insertArticle.run(
        art.code,
        art.description,
        art.quantity,
        art.notes,
        art.createdAt,
        art.updatedAt,
      )
      const articleId = Number(res.lastInsertRowid)
      for (const step of art.steps) {
        insertStep.run(
          articleId,
          step.position,
          step.machineId,
          step.status,
          step.message,
          step.dispatchedAt,
          step.startedAt,
          step.finishedAt,
          step.updatedAt,
        )
      }
    }
    database.exec('COMMIT')
  } catch (e) {
    database.exec('ROLLBACK')
    console.error('Failed to seed default production articles:', e)
  }
}

