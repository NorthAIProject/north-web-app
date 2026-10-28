// north-client web/insights/shell.templ: the insights sub-nav.

import type { Component } from 'svelte';
import BrainIcon from '@lucide/svelte/icons/brain';
import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
import FootprintsIcon from '@lucide/svelte/icons/footprints';
import GaugeIcon from '@lucide/svelte/icons/gauge';
import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
import ListIcon from '@lucide/svelte/icons/list';
import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
import MoonIcon from '@lucide/svelte/icons/moon';
import ReceiptIcon from '@lucide/svelte/icons/receipt';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import TargetIcon from '@lucide/svelte/icons/target';
import UtensilsIcon from '@lucide/svelte/icons/utensils';
import type { Translator } from '#lib/i18n/index.js';

export type SectionKey =
	| 'summary'
	| 'timeline'
	| 'body'
	| 'mind'
	| 'progress'
	| 'training'
	| 'nutrition'
	| 'sleep'
	| 'cardio'
	| 'patterns'
	| 'coach'
	| 'spend';

export type Section = { key: SectionKey; href: string; icon: Component };

export const sections: Section[] = [
	{ key: 'summary', href: '/app/insights', icon: GaugeIcon },
	{ key: 'timeline', href: '/app/insights/timeline', icon: ListIcon },
	{ key: 'body', href: '/app/insights/body', icon: HeartPulseIcon },
	{ key: 'mind', href: '/app/insights/mind', icon: BrainIcon },
	{ key: 'progress', href: '/app/insights/progress', icon: TargetIcon },
	{ key: 'training', href: '/app/insights/training', icon: DumbbellIcon },
	{ key: 'nutrition', href: '/app/insights/nutrition', icon: UtensilsIcon },
	{ key: 'sleep', href: '/app/insights/sleep', icon: MoonIcon },
	{ key: 'cardio', href: '/app/insights/cardio', icon: FootprintsIcon },
	{ key: 'patterns', href: '/app/insights/patterns', icon: SparklesIcon },
	{ key: 'coach', href: '/app/insights/coach', icon: MessagesSquareIcon },
	{ key: 'spend', href: '/app/insights/spend', icon: ReceiptIcon }
];

// Loanwords every language keeps read the sidebar's entry for the same page.
const sectionNavKeys: Partial<Record<SectionKey, string>> = {
	cardio: 'nav.cardio-insights.nav',
	coach: 'nav.coach-insights.nav'
};

/** A section's name, for a page heading and the sub-nav (Go sectionTitle). */
export function sectionTitle(i18n: Translator, key: SectionKey): string {
	return i18n.t(sectionNavKeys[key] ?? `insights.section.${key}`);
}

/** Icons the summary's rings and pinned cards use, by Go icon name. */
export const sectionIcons: Record<string, Component> = Object.fromEntries(sections.map((s) => [s.key, s.icon]));
