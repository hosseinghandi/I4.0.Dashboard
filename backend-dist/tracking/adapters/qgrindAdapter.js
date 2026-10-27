// Collects the text of every element with the given tag name anywhere in the MTConnect streams.
function collect(value, tag, found = []) {
    if (Array.isArray(value)) {
        for (const item of value)
            collect(item, tag, found);
    }
    else if (value !== null && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
            if (key === tag) {
                for (const item of Array.isArray(child) ? child : [child]) {
                    const text = item !== null && typeof item === 'object' ? item['#text'] : item;
                    found.push(text === undefined ? '' : String(text));
                }
            }
            else {
                collect(child, tag, found);
            }
        }
    }
    return found;
}
export function createQGrindAdapter(qgrind) {
    return {
        machineId: 'qgrind',
        unavailableReason: () => (qgrind.isConfigured ? null : 'Agente MTConnect Q-Grind non configurato.'),
        async observe(_article, previous) {
            const result = await qgrind.readStatus();
            if (!result.success)
                throw new Error(result.message || 'Lettura MTConnect non riuscita.');
            const faults = collect(result.data, 'Fault');
            if (faults.length > 0)
                return { status: 'error', message: `Guasto macchina${faults[0] ? `: ${faults[0]}` : ''}` };
            const execution = collect(result.data, 'Execution')[0]?.toUpperCase() ?? 'SCONOSCIUTO';
            if (execution === 'ACTIVE')
                return { status: 'working', message: 'In lavorazione (Execution: ACTIVE)' };
            if (previous === 'working' && (execution === 'READY' || execution === 'PROGRAM_COMPLETED')) {
                return { status: 'finished', message: `Lavorazione completata (Execution: ${execution})` };
            }
            if (previous === 'working')
                return { status: 'working', message: `In pausa (Execution: ${execution})` };
            return { status: 'idle', message: `In attesa dell’avvio sulla macchina (Execution: ${execution})` };
        },
    };
}
