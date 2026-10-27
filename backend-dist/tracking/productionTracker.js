const timestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
/**
 * Drives production article steps from real machine data. Only the first unfinished
 * step of each article is active: it is handed to its machine, then followed until
 * the machine reports that it is finished.
 */
export class ProductionTracker {
    database;
    intervalMs;
    timer = null;
    ticking = false;
    adapters;
    constructor(database, adapters, intervalMs = 2000) {
        this.database = database;
        this.intervalMs = intervalMs;
        this.adapters = new Map(adapters.map((adapter) => [adapter.machineId, adapter]));
    }
    start() {
        if (this.timer)
            return;
        this.timer = setInterval(() => void this.tick(), this.intervalMs);
    }
    stop() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    async tick() {
        if (this.ticking)
            return;
        this.ticking = true;
        try {
            const rows = this.database
                .prepare(`SELECT s.*, a.code, a.description, a.quantity
           FROM production_article_steps s
           JOIN production_articles a ON a.id = s.production_article_id
           WHERE s.status != 'finished'
           ORDER BY s.production_article_id, s.position`)
                .all();
            const seen = new Set();
            for (const step of rows) {
                if (seen.has(step.production_article_id))
                    continue;
                seen.add(step.production_article_id);
                try {
                    await this.process(step);
                }
                catch (error) {
                    console.error(`Production tracking failed for ${step.code}/${step.machine_id}:`, error);
                }
            }
        }
        finally {
            this.ticking = false;
        }
    }
    async process(step) {
        const adapter = this.adapters.get(step.machine_id);
        if (!adapter) {
            this.save(step, step.status, 'Nessuna fonte dati: driver macchina non disponibile.', step.dispatched_at);
            return;
        }
        const unavailable = adapter.unavailableReason();
        if (unavailable) {
            this.save(step, step.status, unavailable, step.dispatched_at);
            return;
        }
        const article = { code: step.code, description: step.description, quantity: step.quantity };
        try {
            if (!step.dispatched_at) {
                const busy = this.database
                    .prepare(`SELECT 1 FROM production_article_steps
             WHERE machine_id = ? AND dispatched_at IS NOT NULL AND status != 'finished' AND id != ?`)
                    .get(step.machine_id, step.id);
                if (busy) {
                    this.save(step, 'pending', 'In coda: la macchina sta lavorando un altro Production Article.', null);
                    return;
                }
                await adapter.dispatch?.(article);
                this.save(step, 'pending', 'Inviato alla macchina, in attesa dell’avvio.', timestamp());
                return;
            }
            const observation = await adapter.observe(article, step.status);
            const status = observation.status === 'idle' ? (step.status === 'error' ? 'pending' : step.status) : observation.status;
            this.save(step, status, observation.message, step.dispatched_at);
        }
        catch (error) {
            // A failed dispatch stays pending and is retried on the next tick.
            const reason = error instanceof Error ? error.message : String(error);
            this.save(step, step.status, `Macchina non raggiungibile: ${reason}`, step.dispatched_at);
        }
    }
    save(step, status, message, dispatchedAt) {
        if (status === step.status && message === step.message && dispatchedAt === step.dispatched_at)
            return;
        const now = timestamp();
        const startedAt = status === 'working' ? (step.started_at ?? now) : step.started_at;
        this.database
            .prepare(`UPDATE production_article_steps
         SET status = ?, message = ?, dispatched_at = ?, started_at = ?,
             finished_at = ?, updated_at = ?
         WHERE id = ?`)
            .run(status, message, dispatchedAt, startedAt, status === 'finished' ? now : null, now, step.id);
        this.database
            .prepare('UPDATE production_articles SET updated_at = ? WHERE id = ?')
            .run(now, step.production_article_id);
    }
}
