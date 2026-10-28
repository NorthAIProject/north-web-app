// Inbox helpers (Go web/inbox): the suggestion's label and the filing a form posts.

import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';

export type Inbox = components['schemas']['Inbox'];
export type InboxItem = components['schemas']['InboxItem'];
export type Suggestion = components['schemas']['InboxSuggestion'];
export type Destination = Suggestion['destination'];
export type GoalOption = { id: string; title: string };

/** How many active goals Go offered (goals.ListActive's contextGoals). */
const FILING_GOALS = 8;

/** The active goals a note can be filed under. */
export function activeGoalsForFiling(goals: { id: string; title: string; status: string }[]): GoalOption[] {
	return goals
		.filter((g) => g.status === 'active')
		.slice(0, FILING_GOALS)
		.map((g) => ({ id: g.id, title: g.title }));
}

export function suggestionLabel(i18n: Translator, s: Suggestion): string {
	switch (s.destination) {
		case 'goal_note':
			return i18n.tf('inbox.suggest.goal', s.goalTitle ?? '');
		case 'knowledge':
			return s.title ? i18n.tf('inbox.suggest.knowledge_titled', s.title) : i18n.t('inbox.dest.knowledge');
		default:
			return i18n.t('inbox.dest.journal');
	}
}

/** The filing a form posted: destination, and the goal and title when given. */
export function filingFrom(form: FormData): { destination: Destination; goalId?: string; title?: string } {
	const raw = String(form.get('destination') ?? '');
	const destination: Destination = raw === 'goal_note' || raw === 'knowledge' ? raw : 'journal';
	const goalId = String(form.get('goal_id') ?? '').trim();
	const title = String(form.get('title') ?? '').trim();
	return { destination, ...(goalId ? { goalId } : {}), ...(title ? { title } : {}) };
}
