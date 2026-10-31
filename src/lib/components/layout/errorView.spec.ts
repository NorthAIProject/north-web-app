import { describe, expect, it } from 'vitest';
import { createTranslator } from '#lib/i18n/index.js';
import { errorView } from './errorView';

const es = createTranslator(
	'es',
	{
		'layout.error.notfound.title': 'Página no encontrada',
		'layout.error.notfound.reason': 'No hay nada en esta dirección.',
		'layout.error.server.title': 'Algo ha fallado',
		'layout.error.server.reason': 'El servidor no ha podido responder.',
		'layout.error.request.title': 'No se ha podido completar',
		'layout.error.request.reason': 'La solicitud no se ha podido leer.'
	},
	{}
);

describe('errorView', () => {
	it('never shows SvelteKit\'s raw "Internal Error"', () => {
		expect(errorView(es, 500, 'Internal Error')).toEqual({
			title: 'Algo ha fallado',
			reason: 'El servidor no ha podido responder.'
		});
	});

	it('drops the raw English not-found messages left in loads', () => {
		for (const message of ['Not found', 'Not found.', 'Not Found', undefined, '']) {
			expect(errorView(es, 404, message)).toEqual({
				title: 'Página no encontrada',
				reason: 'No hay nada en esta dirección.'
			});
		}
	});

	it('keeps a specific message as a detail under the localised reason', () => {
		expect(errorView(es, 404, 'Plan no encontrado.')).toEqual({
			title: 'Página no encontrada',
			reason: 'No hay nada en esta dirección.',
			detail: 'Plan no encontrado.'
		});
	});

	it('treats other 4xx as a request problem', () => {
		expect(errorView(es, 422, 'That request could not be read.').title).toBe(
			'No se ha podido completar'
		);
		expect(errorView(es, 400, 'That request could not be read.').detail).toBeUndefined();
	});
});
