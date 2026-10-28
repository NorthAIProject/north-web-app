// Stand-ins for the two provider APIs north-client calls from flows the fake
// AI provider cannot reach. No real key or account is involved:
//
//   POST /v1/messages              Anthropic Messages. Answers the progress
//                                  estimate and compare (vision) requests.
//   POST /v1/audio/transcriptions  OpenAI-shaped speech to text, the shape the
//                                  in-cluster whisper service speaks. Answers
//                                  dictation.
//
// Run:  bun tests/e2e/stubs/providers.ts          (port 8099, or STUB_PORT)
// API:  ANTHROPIC_API_KEY=stub ANTHROPIC_BASE_URL=http://127.0.0.1:8099
//       TRANSCRIBE_PROVIDER_OPENAI_BASEURL=http://127.0.0.1:8099/v1
//       TRANSCRIBE_PROVIDER_OPENAI_MODEL=stub
// Without ANTHROPIC_FIRST the chat chain stays on the fake provider; only the
// vision client goes to Anthropic (cmd/web/routes.go, appVision).

export const transcript = 'Two eggs and a slice of toast';
export const estimate = { notes: 'Clear photos.', confidence: 'medium', waist_cm: 81.5, hips_cm: 97, chest_cm: 99.5 };
export const comparison = {
	limits: '',
	confidence: 'medium',
	summary: 'The waist looks slightly narrower from the front. The side view is much the same.'
};

function message(text: string): Response {
	return Response.json({
		id: 'msg_stub',
		type: 'message',
		role: 'assistant',
		model: 'claude-haiku-5-5',
		content: [{ type: 'text', text }],
		stop_reason: 'end_turn',
		stop_sequence: null,
		usage: { input_tokens: 1, output_tokens: 1 }
	});
}

async function messages(request: Request): Promise<Response> {
	const body = await request.json();
	const properties = body?.output_config?.format?.schema?.properties ?? {};
	if ('waist_cm' in properties) return message(JSON.stringify(estimate));
	if ('summary' in properties) return message(JSON.stringify(comparison));
	return Response.json(
		{ type: 'error', error: { type: 'invalid_request_error', message: 'stub: unexpected request' } },
		{ status: 400 }
	);
}

async function transcriptions(request: Request): Promise<Response> {
	const form = await request.formData();
	if (!(form.get('file') instanceof Blob)) return Response.json({ error: 'no file' }, { status: 400 });
	return Response.json({ text: transcript });
}

if (import.meta.main) {
	const port = Number(process.env.STUB_PORT ?? 8099);
	Bun.serve({
		port,
		hostname: '127.0.0.1',
		fetch(request) {
			const { pathname } = new URL(request.url);
			if (request.method === 'POST' && pathname === '/v1/messages') return messages(request);
			if (request.method === 'POST' && pathname === '/v1/audio/transcriptions') return transcriptions(request);
			return new Response('not found', { status: 404 });
		}
	});
	console.log(`provider stubs on http://127.0.0.1:${port}`);
}
