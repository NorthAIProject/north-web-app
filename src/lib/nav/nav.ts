import type { Component } from 'svelte';
import type { Translator } from '#lib/i18n/index.js';
import { destinations, groups, type Destination, type Group } from './destinations';

// The sidebar, folded from the destinations registry (Go: layout.BuildNav).
// The rail shows a deliberate subset; the command palette reaches the rest.

export type NavItem = {
	label: string;
	href: string;
	icon?: Component;
	active: boolean;
	children: NavItem[];
};

export type NavGroup = {
	label: string;
	items: NavItem[];
	/** The first week's fold: rendered collapsed behind its label. */
	more?: boolean;
	open?: boolean;
};

/** The rail items a first week keeps in view (Go: firstWeekNav). */
const firstWeekNav = ['/app', '/app/chat', '/app/check-ins', '/app/goals'];

export function groupLabel(i18n: Translator, group: Group | 'more'): string {
	return i18n.t(`nav.group.${group.toLowerCase()}`);
}

/** Looks key up, falling back to the registry's own English rather than the key. */
function translate(i18n: Translator, key: string, english: string): string {
	return i18n.has(key) ? i18n.t(key) : english;
}

export function labelOf(i18n: Translator, d: Destination): string {
	return translate(i18n, d.key, d.label);
}

export function descriptionOf(i18n: Translator, d: Destination): string {
	return translate(i18n, `${d.key}.desc`, d.description);
}

function navLabelOf(i18n: Translator, d: Destination): string {
	return d.nav?.label ? translate(i18n, `${d.key}.nav`, d.nav.label) : labelOf(i18n, d);
}

/**
 * The rail item a path belongs to: the longest registered href that is the
 * path or a parent of it. "/app" only ever matches itself, or every page
 * would light My Day.
 */
export function activeHref(pathname: string, hrefs: string[]): string | undefined {
	let best: string | undefined;
	for (const href of hrefs) {
		const hit = href === pathname || (href !== '/app' && pathname.startsWith(href + '/'));
		if (hit && (!best || href.length > best.length)) best = href;
	}
	return best;
}

export function buildNav(i18n: Translator, pathname: string, simple: boolean): NavGroup[] {
	const shown = destinations.filter((d) => d.nav?.show);
	const active = activeHref(
		pathname,
		shown.map((d) => d.href)
	);

	const out: NavGroup[] = [];
	for (const group of groups) {
		const items: NavItem[] = [];
		const byHref = new Map<string, NavItem>();

		for (const d of shown) {
			if (d.group !== group || d.nav?.under) continue;
			const item: NavItem = { label: navLabelOf(i18n, d), href: d.href, icon: d.icon, active: false, children: [] };
			if (d.nav?.selfChildLabel) {
				// A section landing page that is also its own first view: one
				// page wearing two labels, not two destinations.
				item.children.push({
					label: translate(i18n, `${d.key}.self`, d.nav.selfChildLabel),
					href: d.href,
					active: false,
					children: []
				});
			}
			byHref.set(d.href, item);
			items.push(item);
		}
		for (const d of shown) {
			if (d.group !== group || !d.nav?.under) continue;
			byHref.get(d.nav.under)?.children.push({ label: navLabelOf(i18n, d), href: d.href, active: false, children: [] });
		}
		if (items.length) out.push({ label: groupLabel(i18n, group), items });
	}

	for (const group of out) {
		for (const item of group.items) {
			item.active = item.href === active;
			for (const child of item.children) {
				child.active = child.href === active;
				// A parent whose child is the current page stays lit too.
				if (child.active) item.active = true;
			}
		}
	}
	return simple ? foldUnderMore(i18n, out) : out;
}

/** Keeps the first-week items in place and moves the rest under More. */
function foldUnderMore(i18n: Translator, nav: NavGroup[]): NavGroup[] {
	const kept: NavGroup[] = [];
	const more: NavGroup = { label: groupLabel(i18n, 'more'), items: [], more: true, open: false };
	for (const group of nav) {
		const keep: NavGroup = { label: group.label, items: [] };
		for (const item of group.items) {
			if (firstWeekNav.includes(item.href)) {
				keep.items.push(item);
				continue;
			}
			more.items.push(item);
			if (item.active) more.open = true;
		}
		if (keep.items.length) kept.push(keep);
	}
	if (more.items.length) kept.push(more);
	return kept;
}
