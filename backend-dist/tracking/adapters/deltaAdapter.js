export function createDeltaAdapter(delta) {
    return {
        machineId: 'delta',
        unavailableReason: () => (delta.isConnected ? null : 'Delta non connessa (OPC UA).'),
        async dispatch(article) {
            const result = await delta.writeData({
                numeroOrdine: article.code,
                commessa: article.code,
                quantitaRichiesta: String(article.quantity),
            });
            if (!result.success)
                throw new Error(result.message || 'La Delta ha rifiutato i dati.');
        },
        async observe(article, previous) {
            const result = await delta.readData();
            if (!result.success || !result.data)
                throw new Error(result.message || 'Lettura Delta non riuscita.');
            const { allarme, fineCiclo, inizioCiclo, stato, pezziProdottiTot } = result.data;
            const pieces = `pezzi totali: ${pezziProdottiTot}/${article.quantity}`;
            if (allarme !== 0)
                return { status: 'error', message: `Allarme macchina ${allarme}` };
            // The end-of-cycle flag can be left over from the previous job, so it only counts after we saw work start.
            if (previous === 'working' && fineCiclo)
                return { status: 'finished', message: `Ciclo completato — ${pieces}` };
            if (inizioCiclo || stato)
                return { status: 'working', message: `In lavorazione — ${pieces}` };
            return { status: 'idle', message: 'Parametri inviati, in attesa dell’avvio del ciclo.' };
        },
    };
}
