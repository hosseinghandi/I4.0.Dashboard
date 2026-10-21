import { deltaConfiguration } from "./delta/configuration";
import { mikronConfiguration } from "./mikron/configuration";
import { qgrindConfiguration } from "./qgrind/configuration";
import { zeissConfiguration } from "./zeiss/configuration";
import type {
  MachineConfiguration,
  MachineDefinition,
  MachineId,
} from "./types";

export type { MachineDefinition } from "./types";

export const machineDefinitions: MachineDefinition[] = [
  deltaConfiguration,
  qgrindConfiguration,
  mikronConfiguration,
  zeissConfiguration,
];

export const machineDefinitionById = Object.fromEntries(
  machineDefinitions.map((machine) => [machine.id, machine]),
) as Record<MachineId, MachineDefinition>;

export const defaultMachineConfigurations = Object.fromEntries(
  machineDefinitions.map(({ id, defaultConfiguration }) => [
    id,
    defaultConfiguration,
  ]),
) as Record<MachineId, MachineConfiguration>;
