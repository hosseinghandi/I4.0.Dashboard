import { AttributeIds, DataType, MessageSecurityMode, OPCUAClient, SecurityPolicy, StatusCodes, Variant, } from 'node-opcua';
const nodeIds = {
    pezziProdottiTot: 'ns=2;s=Tags.PezziTot',
    pezziPlateau: 'ns=2;s=Tags.PezziPlateau',
    stato: 'ns=2;s=Tags.Stato',
    statoDeriva: 'ns=2;s=Tags.StatoDeriva',
    allarme: 'ns=2;s=Tags.Allarme',
    inizioCiclo: 'ns=2;s=Tags.InizioCiclo',
    fineCiclo: 'ns=2;s=Tags.FineCiclo',
    numeroOrdine: 'ns=2;s=Tags.NumeroOrdine',
    commessa: 'ns=2;s=Tags.Commessa',
    quantitaRichiesta: 'ns=2;s=Tags.QtaRichiesta',
};
const readFields = [
    'pezziProdottiTot',
    'pezziPlateau',
    'stato',
    'statoDeriva',
    'allarme',
    'inizioCiclo',
    'fineCiclo',
];
const writeFields = ['numeroOrdine', 'commessa', 'quantitaRichiesta'];
const writeDataTypes = {
    numeroOrdine: DataType.String,
    commessa: DataType.String,
    quantitaRichiesta: DataType.String,
};
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function statusMessage(status) {
    return status?.toString() || 'Unknown OPC UA status';
}
function toBoolean(value, field) {
    if (typeof value === 'boolean')
        return value;
    if (value === 0 || value === 1)
        return value === 1;
    throw new Error(`${field} must contain a Boolean or 0/1 value.`);
}
function isJobData(value) {
    return typeof value === 'object' && value !== null &&
        writeFields.every((field) => typeof value[field] === 'string');
}
export class OPCUAMachineService {
    client = null;
    session = null;
    async disconnect() {
        const session = this.session;
        const client = this.client;
        this.session = null;
        this.client = null;
        let closeError;
        if (session) {
            try {
                await session.close();
            }
            catch (error) {
                closeError = error;
            }
        }
        if (client) {
            try {
                await client.disconnect();
            }
            catch (error) {
                closeError ??= error;
            }
        }
        if (closeError)
            throw closeError;
    }
    async connect(ip, port) {
        if (typeof ip !== 'string' || !ip.trim()) {
            return { success: false, message: 'Enter the machine IP address.' };
        }
        if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
            return { success: false, message: 'Enter a valid OPC UA port.' };
        }
        try {
            await this.disconnect();
        }
        catch (error) {
            console.warn('Error closing the previous OPC UA connection:', error);
        }
        const client = OPCUAClient.create({
            endpointMustExist: false,
            securityMode: MessageSecurityMode.None,
            securityPolicy: SecurityPolicy.None,
            connectionStrategy: { maxRetry: 1, initialDelay: 1000, maxDelay: 2000 },
            requestedSessionTimeout: 30000,
            keepSessionAlive: true,
        });
        try {
            await client.connect(`opc.tcp://${ip.trim()}:${port}`);
            this.session = await client.createSession();
            this.client = client;
            return { success: true };
        }
        catch (error) {
            try {
                await client.disconnect();
            }
            catch (cleanupError) {
                console.warn('Error cleaning up failed OPC UA connection:', cleanupError);
            }
            console.error('OPC UA connection failed:', error);
            return { success: false, message: errorMessage(error) };
        }
    }
    async readData() {
        if (!this.session)
            return { success: false, message: 'Not connected to the machine.' };
        try {
            const results = await this.session.read(readFields.map((field) => ({
                nodeId: nodeIds[field],
                attributeId: AttributeIds.Value,
            })));
            const invalid = results
                .map((result, index) => ({ result, field: readFields[index] }))
                .filter(({ result }) => result.statusCode !== StatusCodes.Good);
            if (invalid.length) {
                return {
                    success: false,
                    message: invalid.map(({ result, field }) => `${field}: ${statusMessage(result.statusCode)}`).join('; '),
                };
            }
            const values = results.map((result) => result.value?.value);
            if (values.some((value) => value === null || value === undefined)) {
                return { success: false, message: 'The OPC UA server returned an empty value.' };
            }
            const total = values[0];
            const plateau = values[1];
            const alarm = Number(values[4]);
            if ((typeof total !== 'string' && typeof total !== 'number') ||
                (typeof plateau !== 'string' && typeof plateau !== 'number') ||
                !Number.isFinite(alarm)) {
                return { success: false, message: 'The OPC UA server returned an unexpected value type.' };
            }
            return {
                success: true,
                data: {
                    pezziProdottiTot: total,
                    pezziPlateau: plateau,
                    stato: toBoolean(values[2], 'stato'),
                    statoDeriva: toBoolean(values[3], 'statoDeriva'),
                    allarme: alarm,
                    inizioCiclo: toBoolean(values[5], 'inizioCiclo'),
                    fineCiclo: toBoolean(values[6], 'fineCiclo'),
                },
            };
        }
        catch (error) {
            console.error('OPC UA read failed:', error);
            return { success: false, message: errorMessage(error) };
        }
    }
    async writeData(data) {
        if (!this.session)
            return { success: false, message: 'Not connected to the machine.' };
        if (!isJobData(data))
            return { success: false, message: 'Invalid job parameter data.' };
        try {
            const nodes = await this.session.read(writeFields.map((field) => ({
                nodeId: nodeIds[field],
                attributeId: AttributeIds.Value,
            })));
            const badNode = nodes.find((node) => node.statusCode !== StatusCodes.Good);
            if (badNode) {
                const index = nodes.indexOf(badNode);
                return {
                    success: false,
                    message: `Cannot inspect ${writeFields[index]}: ${statusMessage(badNode.statusCode)}`,
                };
            }
            const mismatch = nodes
                .map((node, index) => ({ field: writeFields[index], actual: node.value?.dataType }))
                .find(({ field, actual }) => actual !== writeDataTypes[field]);
            if (mismatch) {
                return { success: false, message: `Cannot write ${mismatch.field}: machine tag type does not match.` };
            }
            const writes = writeFields.map((field) => ({
                nodeId: nodeIds[field],
                attributeId: AttributeIds.Value,
                value: {
                    value: new Variant({ dataType: writeDataTypes[field], value: data[field] }),
                },
            }));
            const statuses = await this.session.write(writes);
            const failed = statuses
                .map((status, index) => ({ status, field: writeFields[index] }))
                .filter(({ status }) => status !== StatusCodes.Good);
            if (failed.length) {
                return { success: false, message: failed.map(({ status, field }) => `${field}: ${statusMessage(status)}`).join('; ') };
            }
            return { success: true };
        }
        catch (error) {
            console.error('OPC UA write failed:', error);
            return { success: false, message: errorMessage(error) };
        }
    }
}
