export type MachineId = "delta" | "qgrind" | "zeiss" | "mikron";
export type MachineProtocol = "MTConnect" | "OPC UA" | "Driver non disponibile";

export interface MachineData<TValues extends object> {
  values: TValues | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  updatedAt: Date | null;
}

export interface MachineResultField<TValues extends object> {
  key: keyof TValues & string;
  label: string;
  format?: (value: TValues[keyof TValues] | undefined) => string;
}

export interface ApiResult<TData> {
  success: boolean;
  data?: TData;
  message?: string;
}

export interface MachineConfiguration {
  host: string;
  port: string;
  pollIntervalMs: number;
}

export type MachineConfigurations = Record<MachineId, MachineConfiguration>;

export interface MachineDefinition {
  id: MachineId;
  name: string;
  serial: string;
  protocol: MachineProtocol;
  resultView: "mtconnect" | "delta-opcua" | "driver-required";
  defaultConfiguration: MachineConfiguration;
  supportsConnection: boolean;
}
