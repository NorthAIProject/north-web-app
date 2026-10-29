// The API's error envelope (httpx.ErrorBody in north-client):
//
//	{ "error": { "message": "...", "code": "...", "fields": { "email": "..." } } }
//
// Every API function throws ApiError rather than returning a union, so a route
// load can let it bubble into SvelteKit's error page and a form action can
// catch it and hand the field messages back to the form.

export type ApiErrorKind =
	| 'authentication'
	| 'forbidden'
	| 'not_found'
	| 'validation'
	| 'conflict'
	| 'rate_limit'
	| 'unavailable'
	| 'unknown';

export class ApiError extends Error {
	readonly status: number;
	readonly kind: ApiErrorKind;
	readonly code?: string;
	readonly fields: Record<string, string>;
	readonly requestId?: string;
	/** The parsed reply, for a refusal that carries more than the envelope. */
	readonly body?: unknown;

	constructor(init: {
		status: number;
		message: string;
		code?: string;
		fields?: Record<string, string>;
		requestId?: string;
		body?: unknown;
	}) {
		super(init.message);
		this.name = 'ApiError';
		this.status = init.status;
		this.kind = kindFor(init.status);
		this.code = init.code;
		this.fields = init.fields ?? {};
		this.requestId = init.requestId;
		this.body = init.body;
	}

	/** Reads are retried on transient failures; writes never are. */
	get retryable(): boolean {
		return this.kind === 'unavailable' || this.status === 0;
	}
}

export function kindFor(status: number): ApiErrorKind {
	if (status === 401) return 'authentication';
	if (status === 403) return 'forbidden';
	if (status === 404) return 'not_found';
	if (status === 409) return 'conflict';
	if (status === 400 || status === 422) return 'validation';
	if (status === 429) return 'rate_limit';
	if (status === 0 || status >= 500) return 'unavailable';
	return 'unknown';
}

type ErrorBody = {
	error?: { message?: string; code?: string; fields?: Record<string, string> };
};

/** Builds an ApiError from a failed response, whatever its body turned out to be. */
export async function apiErrorFrom(response: Response, body?: unknown): Promise<ApiError> {
	let parsed = body as ErrorBody | undefined;
	if (parsed === undefined) {
		try {
			parsed = (await response.clone().json()) as ErrorBody;
		} catch {
			parsed = undefined;
		}
	}
	const detail = parsed?.error;
	return new ApiError({
		status: response.status,
		message: detail?.message || response.statusText || 'Something went wrong.',
		code: detail?.code,
		fields: detail?.fields,
		requestId: response.headers.get('x-request-id') ?? undefined,
		body: parsed
	});
}

export function isApiError(err: unknown): err is ApiError {
	return err instanceof ApiError;
}
