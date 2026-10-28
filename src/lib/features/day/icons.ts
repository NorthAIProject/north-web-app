// The timeline's icon names (dashboard.Entry.Icon, lucide names) as
// components. Go looked any name up with icon.Icon(name); here the set the
// feed actually emits is listed, and anything else falls back to circle-dot as
// Go's cardIcon does for an empty name.

import type { Component } from 'svelte';
import Activity from '@lucide/svelte/icons/activity';
import CircleCheck from '@lucide/svelte/icons/circle-check';
import CircleDot from '@lucide/svelte/icons/circle-dot';
import Coffee from '@lucide/svelte/icons/coffee';
import Droplet from '@lucide/svelte/icons/droplet';
import Flag from '@lucide/svelte/icons/flag';
import Footprints from '@lucide/svelte/icons/footprints';
import Moon from '@lucide/svelte/icons/moon';
import NotebookPen from '@lucide/svelte/icons/notebook-pen';
import Pill from '@lucide/svelte/icons/pill';
import Smile from '@lucide/svelte/icons/smile';
import Target from '@lucide/svelte/icons/target';
import Timer from '@lucide/svelte/icons/timer';
import TimerOff from '@lucide/svelte/icons/timer-off';
import Utensils from '@lucide/svelte/icons/utensils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const icons: Record<string, Component<any>> = {
	activity: Activity,
	'circle-check': CircleCheck,
	'circle-dot': CircleDot,
	coffee: Coffee,
	droplet: Droplet,
	flag: Flag,
	footprints: Footprints,
	moon: Moon,
	'notebook-pen': NotebookPen,
	pill: Pill,
	smile: Smile,
	target: Target,
	timer: Timer,
	'timer-off': TimerOff,
	utensils: Utensils
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function railIcon(name: string): Component<any> {
	return icons[name] ?? CircleDot;
}
