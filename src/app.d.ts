import type { components } from '#lib/api/generated/schema.js';
import type { Locale } from '#lib/i18n/locales.js';
import type { Appearance } from '#lib/theme.js';

declare global {
	namespace App {
		interface Error {
			message: string;
			requestId?: string;
		}
		interface Locals {
			/**
			 * The signed-in session: north-client's bearer and, on page
			 * requests, the account behind it. Absent for visitors.
			 */
			session?: { token: string; user?: components['schemas']['User'] };
			locale: Locale;
			appearance: Appearance;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
