// Parsed JSON before anything is known about it.

/** A JSON object whose fields have not been checked yet. */
export type JsonObject = Record<string, unknown>;

/** True for a JSON object: not null, not an array, not a bare value. */
export function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
