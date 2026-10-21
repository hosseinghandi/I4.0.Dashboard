export const machinePaths = {
    health: '/health',
    delta: {
        connect: '/api/machines/delta/connect',
        disconnect: '/api/machines/delta/disconnect',
        read: '/api/machines/delta/read',
        write: '/api/machines/delta/write',
    },
    qgrind: {
        agent: '/api/machines/qgrind/agent',
        status: '/api/machines/qgrind/status',
    },
};
