// API shapes the settings components take (generated from the contract).
import type { components } from '#lib/api/generated/schema.js';

type S = components['schemas'];
export type Connection = S['Connection'];
export type ConnectionSetup = S['ConnectionSetup'];
export type CreatedConnection = S['CreatedConnection'];
export type AISettings = S['AISettings'];
export type AIProvider = S['AIProvider'];
export type TelegramSettings = S['TelegramSettings'];
export type CalendarSettings = S['CalendarSettings'];
export type Execution = S['Execution'];
export type VaultStatus = S['VaultStatus'];
