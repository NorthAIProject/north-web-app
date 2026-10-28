import { redirect } from '@sveltejs/kit';

// Go had no /app/nutrition page, so the insights nutrition empty state linked
// to a 404. The food log is where that call to action means to send people.
export const load = () => redirect(307, '/app/nutrition/log');
