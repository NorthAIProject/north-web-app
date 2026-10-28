// The Lucide names internal/dashboard hands the template (Go icon.Icon(name)),
// resolved to components. An unknown name draws the activity glyph rather than
// nothing.

import type { Component } from 'svelte';
import ActivityIcon from '@lucide/svelte/icons/activity';
import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
import CoffeeIcon from '@lucide/svelte/icons/coffee';
import DropletIcon from '@lucide/svelte/icons/droplet';
import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
import FlagIcon from '@lucide/svelte/icons/flag';
import FootprintsIcon from '@lucide/svelte/icons/footprints';
import MoonIcon from '@lucide/svelte/icons/moon';
import NotebookPenIcon from '@lucide/svelte/icons/notebook-pen';
import PillIcon from '@lucide/svelte/icons/pill';
import SmileIcon from '@lucide/svelte/icons/smile';
import TargetIcon from '@lucide/svelte/icons/target';
import TimerIcon from '@lucide/svelte/icons/timer';
import TimerOffIcon from '@lucide/svelte/icons/timer-off';
import UtensilsIcon from '@lucide/svelte/icons/utensils';

const icons: Record<string, Component<{ class?: string }>> = {
	activity: ActivityIcon,
	'circle-check': CircleCheckIcon,
	coffee: CoffeeIcon,
	droplet: DropletIcon,
	dumbbell: DumbbellIcon,
	flag: FlagIcon,
	footprints: FootprintsIcon,
	moon: MoonIcon,
	'notebook-pen': NotebookPenIcon,
	pill: PillIcon,
	smile: SmileIcon,
	target: TargetIcon,
	timer: TimerIcon,
	'timer-off': TimerOffIcon,
	utensils: UtensilsIcon
};

export function iconFor(name: string): Component<{ class?: string }> {
	return icons[name] ?? ActivityIcon;
}
