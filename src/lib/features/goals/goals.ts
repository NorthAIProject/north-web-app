// Goal view helpers: a port of north-client web/goals/goals.templ's Go
// functions, internal/goals/goal (Progress, DaysRemaining, Overdue) and
// internal/goals/view.go (buildInstruments), with the same catalogue keys.

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

export type GoalSummary = components['schemas']['GoalSummary'];
export type GoalDetail = components['schemas']['GoalDetail'];
export type Milestone = components['schemas']['Milestone'];
export type GoalUpdate = components['schemas']['GoalUpdate'];

/** goal.Categories (lifedomain.Domains), in display order. */
export const CATEGORIES = ['fitness', 'health', 'work', 'learning', 'personal', 'other'];

type Progressable = Pick<GoalSummary, 'milestoneTotal' | 'milestoneDone' | 'latestUpdate'>;

/** Goal.Progress: milestones done, else the latest note's percentage. */
export function progress(g: Progressable): number | null {
	if (g.milestoneTotal > 0) return Math.trunc((g.milestoneDone * 100) / g.milestoneTotal);
	if (g.latestUpdate?.progress != null) return g.latestUpdate.progress;
	return null;
}

/** progressLabel: "2 of 5", "40%", or empty. */
export function progressLabel(i18n: Translator, g: Progressable): string {
	if (g.milestoneTotal > 0) return i18n.tf('goals.progress.of', g.milestoneDone, g.milestoneTotal);
	const pct = progress(g);
	return pct == null ? '' : `${pct}%`;
}

/**
 * Goal.DaysRemaining: whole days until the target date (midnight UTC, as the
 * column is read), negative once passed, truncated toward zero like Go's int().
 */
export function daysRemaining(targetDate: string, now: number = Date.now()): number {
	return Math.trunc((Date.parse(`${targetDate}T00:00:00Z`) - now) / 86_400_000);
}

export function isActive(g: Pick<GoalSummary, 'status'>): boolean {
	return g.status === 'active';
}

/** Goal.Overdue: only an active goal can be overdue. */
export function overdue(g: Pick<GoalSummary, 'status' | 'targetDate'>, now: number = Date.now()): boolean {
	return isActive(g) && !!g.targetDate && daysRemaining(g.targetDate, now) < 0;
}

const day = (i18n: Translator, d: string, layout: string) => formatTime(i18n.locale, d, layout, 'UTC');

/** deadlineLabel: goal.Goal.Deadline in the reader's language. */
export function deadlineLabel(i18n: Translator, g: Pick<GoalSummary, 'targetDate'>, now: number = Date.now()): string {
	if (!g.targetDate) return i18n.t('goals.deadline.none');
	const days = daysRemaining(g.targetDate, now);
	if (days < 0) return i18n.tf('goals.deadline.ago', day(i18n, g.targetDate, '2 Jan 2006'), -days);
	if (days === 0) return i18n.t('goals.deadline.today');
	if (days === 1) return i18n.t('goals.deadline.tomorrow');
	if (days < 30) return i18n.tf('goals.deadline.in', day(i18n, g.targetDate, '2 Jan'), days);
	return day(i18n, g.targetDate, '2 January 2006');
}

/** A milestone's date, "2 Jan 2006". */
export function milestoneDate(i18n: Translator, d: string): string {
	return day(i18n, d, '2 Jan 2006');
}

/** categoryLabel: an unknown category reads as Other. */
export function categoryLabel(i18n: Translator, category: string): string {
	return i18n.t(`lifedomain.${CATEGORIES.includes(category) ? category : 'other'}`);
}

/** statusLabel: an unknown status reads as Active. */
export function statusLabel(i18n: Translator, status: string): string {
	const known = ['achieved', 'paused', 'abandoned'].includes(status) ? status : 'active';
	return i18n.t(`goal.status.${known}`);
}

/** buildInstruments: the goals index header. */
export function instruments(list: GoalSummary[]) {
	let active = 0;
	let sum = 0;
	let n = 0;
	const byCategory = new Map<string, number>();
	for (const g of list) {
		if (!isActive(g)) continue;
		active++;
		const pct = progress(g);
		if (pct != null) {
			sum += pct;
			n++;
		}
		const cat = CATEGORIES.includes(g.category) && g.category ? g.category : 'other';
		byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
	}
	return {
		activeCount: active,
		avgProgress: n > 0 ? Math.trunc(sum / n) : 0,
		byCategory: CATEGORIES.filter((c) => (byCategory.get(c) ?? 0) > 0).map((c) => ({
			category: c,
			count: byCategory.get(c)!
		}))
	};
}

/** The submitted goal fields (Go GoalForm). */
export type GoalForm = {
	title: string;
	motivation: string;
	success: string;
	category: string;
	targetDate: string;
};

export function blankGoalForm(): GoalForm {
	return { title: '', motivation: '', success: '', category: '', targetDate: '' };
}

/** FormFor: pre-filled from an existing goal. */
export function formFor(g: GoalDetail): GoalForm {
	return {
		title: g.title,
		motivation: g.motivation,
		success: g.success,
		category: g.category,
		targetDate: g.targetDate ?? ''
	};
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/** formFrom + inputFrom: trimmed fields; an unreadable date is no date. */
export function goalFormFrom(data: FormData): GoalForm {
	const text = (k: string) => String(data.get(k) ?? '').trim();
	return {
		title: text('title'),
		motivation: text('motivation'),
		success: text('success'),
		category: text('category'),
		targetDate: text('target_date')
	};
}

export function goalRequest(f: GoalForm): components['schemas']['GoalRequest'] {
	return {
		title: f.title,
		motivation: f.motivation,
		success: f.success,
		category: f.category,
		targetDate: datePattern.test(f.targetDate) ? f.targetDate : undefined
	};
}

/** milestoneFrom: the milestone fields; an unreadable date is no date. */
export function milestoneFrom(data: FormData): { title: string; date: string } {
	return {
		title: String(data.get('milestone_title') ?? '').trim(),
		date: String(data.get('milestone_date') ?? '').trim()
	};
}

export function milestoneRequest(m: { title: string; date: string }): components['schemas']['MilestoneRequest'] {
	return { title: m.title, targetDate: datePattern.test(m.date) ? m.date : undefined };
}

/** The API names the date targetDate; the Go form called it target_date. */
export function goalErrors(fields: Record<string, string>): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(fields)) out[k === 'targetDate' ? 'target_date' : k] = v;
	return out;
}

/** momentFrom: the card a status change's ?done= marker shows once. */
export function momentFrom(
	i18n: Translator,
	g: GoalDetail,
	done: string | null
): { kind: string; title: string; body: string } | null {
	if (done === 'goal') {
		return { kind: 'goal_achieved', title: i18n.tf('moments.goal.title', g.title), body: i18n.t('moments.goal.body') };
	}
	if (done?.startsWith('milestone:')) {
		const m = g.milestones.find((x) => x.id === done.slice('milestone:'.length));
		if (!m) return null;
		return {
			kind: 'milestone_completed',
			title: i18n.t('moments.milestone.title'),
			body: i18n.tf('moments.milestone.body', m.title, g.title)
		};
	}
	return null;
}
