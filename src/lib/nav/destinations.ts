// GENERATED from north-client web/shared/layout/destinations.go, then owned here.
// Every page a signed-in person can navigate to, in one list: the sidebar and
// the command palette both read it, so they cannot drift apart. Adding a page
// means adding a row here.

import type { Component } from 'svelte';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import BrainIcon from '@lucide/svelte/icons/brain';
import CalculatorIcon from '@lucide/svelte/icons/calculator';
import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
import CarrotIcon from '@lucide/svelte/icons/carrot';
import ChartLineIcon from '@lucide/svelte/icons/chart-line';
import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
import FileUpIcon from '@lucide/svelte/icons/file-up';
import FlagIcon from '@lucide/svelte/icons/flag';
import FootprintsIcon from '@lucide/svelte/icons/footprints';
import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
import HistoryIcon from '@lucide/svelte/icons/history';
import InboxIcon from '@lucide/svelte/icons/inbox';
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import MapIcon from '@lucide/svelte/icons/map';
import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
import MoonIcon from '@lucide/svelte/icons/moon';
import NewspaperIcon from '@lucide/svelte/icons/newspaper';
import NotebookIcon from '@lucide/svelte/icons/notebook';
import NotebookPenIcon from '@lucide/svelte/icons/notebook-pen';
import PersonStandingIcon from '@lucide/svelte/icons/person-standing';
import PlugIcon from '@lucide/svelte/icons/plug';
import RulerIcon from '@lucide/svelte/icons/ruler';
import ScaleIcon from '@lucide/svelte/icons/scale';
import SearchIcon from '@lucide/svelte/icons/search';
import SettingsIcon from '@lucide/svelte/icons/settings';
import SmileIcon from '@lucide/svelte/icons/smile';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import TargetIcon from '@lucide/svelte/icons/target';
import TimerIcon from '@lucide/svelte/icons/timer';
import TrophyIcon from '@lucide/svelte/icons/trophy';
import UsersIcon from '@lucide/svelte/icons/users';
import UtensilsIcon from '@lucide/svelte/icons/utensils';
import VideoIcon from '@lucide/svelte/icons/video';
import ZapIcon from '@lucide/svelte/icons/zap';

export const groups = ['Today', 'Body', 'Mind', 'Progress', 'System'] as const;
export type Group = (typeof groups)[number];

export type NavPlacement = {
	/** Show puts the destination in the rail. */
	show?: boolean;
	/** Overrides the label in the rail (catalogue key: `${key}.nav`). */
	label?: string;
	/** Href of the parent item this nests below. */
	under?: string;
	/** For the one page that is also its own first child (key: `${key}.self`). */
	selfChildLabel?: string;
};

export type Destination = {
	/** Catalogue stem: label at key, description at `${key}.desc`. */
	key: string;
	/** English fallback when the catalogue has no entry. */
	label: string;
	href: string;
	icon: Component;
	group: Group;
	description: string;
	/** Lowercase synonyms: matched by the palette, never rendered. */
	keywords: string[];
	nav?: NavPlacement;
};

export const destinations: Destination[] = [
	{
		key: 'nav.my-day',
		label: 'My Day',
		href: '/app',
		icon: CalendarDaysIcon,
		group: 'Today',
		description: 'Your day on one screen: food, water, sleep, movement.',
		keywords: ['home', 'today', 'start', 'timeline', 'day', 'calendar'],
		nav: { show: true }
	},
	{
		key: 'nav.overview',
		label: 'Overview',
		href: '/app/overview',
		icon: LayoutDashboardIcon,
		group: 'Today',
		description: 'Where today stands.',
		keywords: ['dashboard', 'trends', 'charts', 'briefing'],
		nav: { show: true }
	},
	{
		key: 'nav.quick-capture',
		label: 'Quick capture',
		href: '/app/capture',
		icon: ZapIcon,
		group: 'Today',
		description: 'Write your day in one line.',
		keywords: ['log', 'add', 'quick', 'capture', 'water', 'sleep', 'weight', 'habit', 'note'],
		nav: { show: true }
	},
	{
		key: 'nav.check-ins',
		label: 'Check-ins',
		href: '/app/check-ins',
		icon: SmileIcon,
		group: 'Today',
		description: 'How you are doing, in your words.',
		keywords: ['mood', 'daily', 'log', 'feeling'],
		nav: { show: true }
	},
	{
		key: 'nav.coach',
		label: 'Coach',
		href: '/app/chat',
		icon: MessageCircleIcon,
		group: 'Today',
		description: 'Talk it through.',
		keywords: ['chat', 'ai', 'ask', 'assistant', 'conversation'],
		nav: { show: true }
	},
	{
		key: 'nav.daily',
		label: 'Daily post',
		href: '/app/daily',
		icon: NewspaperIcon,
		group: 'Today',
		description: 'One short read a day, written by AI.',
		keywords: ['post', 'read', 'article', 'tip', 'wellness', 'wellbeing', 'diet', 'board'],
		nav: { show: true }
	},
	{
		key: 'nav.fitness',
		label: 'Fitness',
		href: '/app/fitness',
		icon: DumbbellIcon,
		group: 'Body',
		description: 'Training, activity, and nutrition in one place.',
		keywords: ['strava', 'health', 'hub', 'exercise'],
		nav: { show: true }
	},
	{
		key: 'nav.training',
		label: 'Training',
		href: '/app/training',
		icon: ClipboardListIcon,
		group: 'Body',
		description: 'AI-generated workout plans.',
		keywords: ['workout', 'program', 'gym', 'routine', 'lifting']
	},
	{
		key: 'nav.new-training-plan',
		label: 'New training plan',
		href: '/app/training/new',
		icon: ClipboardListIcon,
		group: 'Body',
		description: 'Generate a plan from your goals.',
		keywords: ['workout', 'create', 'generate', 'program']
	},
	{
		key: 'nav.import-training-plan',
		label: 'Import training plan',
		href: '/app/training/import',
		icon: FileUpIcon,
		group: 'Body',
		description: 'Bring in a plan from a file or photo.',
		keywords: ['workout', 'upload', 'spreadsheet', 'pdf', 'coach', 'import']
	},
	{
		key: 'nav.import-hevy',
		label: 'Import from Hevy',
		href: '/app/lifts/import',
		icon: FileUpIcon,
		group: 'Body',
		description: 'Bring your workout history from Hevy.',
		keywords: ['hevy', 'history', 'workouts', 'sets', 'csv', 'import', 'lifting']
	},
	{
		key: 'nav.training-plans',
		label: 'Training plans',
		href: '/app/training/plans',
		icon: ClipboardListIcon,
		group: 'Body',
		description: 'Every plan you have saved.',
		keywords: ['workout', 'saved', 'history', 'programs']
	},
	{
		key: 'nav.exercises',
		label: 'Exercises',
		href: '/app/exercises',
		icon: PersonStandingIcon,
		group: 'Body',
		description: 'What each movement trains, on the model.',
		keywords: ['muscles', 'movement', 'catalog', 'anatomy']
	},
	{
		key: 'nav.form-check',
		label: 'Form check',
		href: '/app/form',
		icon: VideoIcon,
		group: 'Body',
		description: 'Upload a clip, get feedback.',
		keywords: ['video', 'technique', 'review', 'upload']
	},
	{
		key: 'nav.activity-timer',
		label: 'Activity timer',
		href: '/app/activity',
		icon: TimerIcon,
		group: 'Body',
		description: 'Track a session, see calories burned.',
		keywords: ['stopwatch', 'session', 'start', 'calories', 'track']
	},
	{
		key: 'nav.calculator',
		label: 'Calculator',
		href: '/app/calculator',
		icon: CalculatorIcon,
		group: 'Body',
		description: 'BMR, TDEE, and a macro target.',
		keywords: ['bmr', 'tdee', 'macros', 'calories', 'protein', 'weight']
	},
	{
		key: 'nav.ingredients',
		label: 'Ingredients',
		href: '/app/nutrition/ingredients',
		icon: CarrotIcon,
		group: 'Body',
		description: 'Shared and your own foods.',
		keywords: ['food', 'nutrition', 'database', 'meals']
	},
	{
		key: 'nav.meal-plans',
		label: 'Meal plans',
		href: '/app/nutrition/plans',
		icon: UtensilsIcon,
		group: 'Body',
		description: 'Build plans, track totals.',
		keywords: ['food', 'diet', 'nutrition', 'recipes', 'eating']
	},
	{
		key: 'nav.import-meal-plan',
		label: 'Import meal plan',
		href: '/app/nutrition/import',
		icon: FileUpIcon,
		group: 'Body',
		description: 'Bring in a meal plan from a file or photo.',
		keywords: ['food', 'diet', 'upload', 'spreadsheet', 'pdf', 'import']
	},
	{
		key: 'nav.generate-meal-plan',
		label: 'Build a meal plan',
		href: '/app/nutrition/plans/generate',
		icon: SparklesIcon,
		group: 'Body',
		description: 'Let the coach build one to your macros.',
		keywords: ['food', 'diet', 'ai', 'generate', 'create', 'macros']
	},
	{
		key: 'nav.food-log',
		label: 'Food log',
		href: '/app/nutrition/log',
		icon: NotebookPenIcon,
		group: 'Body',
		description: 'Log today, see progress.',
		keywords: ['diary', 'eat', 'nutrition', 'calories', 'track']
	},
	{
		key: 'nav.strava-activities',
		label: 'Strava activities',
		href: '/app/fitness/activities',
		icon: MapIcon,
		group: 'Body',
		description: 'Every session, and whether you are keeping it up.',
		keywords: ['strava', 'runs', 'rides', 'routes', 'map', 'gps']
	},
	{
		key: 'nav.care',
		label: 'Care',
		href: '/app/care',
		icon: HeartPulseIcon,
		group: 'Body',
		description: 'Water, sleep, and habits.',
		keywords: ['hydration', 'sleep', 'habits', 'reminders', 'wellbeing'],
		nav: { show: true }
	},
	{
		key: 'nav.mind',
		label: 'Mind',
		href: '/app/mind',
		icon: BrainIcon,
		group: 'Mind',
		description: 'Journal and reflect.',
		keywords: ['journal', 'reflection', 'writing', 'thoughts'],
		nav: { show: true }
	},
	{
		key: 'nav.memory',
		label: 'Memory',
		href: '/app/memories',
		icon: SparklesIcon,
		group: 'Mind',
		description: 'What North remembers about you.',
		keywords: ['remember', 'recall', 'facts', 'profile', 'knows'],
		nav: { show: true }
	},
	{
		key: 'nav.decisions',
		label: 'Decisions',
		href: '/app/decisions',
		icon: ScaleIcon,
		group: 'Mind',
		description: 'The choices you made, and why.',
		keywords: ['journal', 'choices', 'reasoning', 'log'],
		nav: { show: true }
	},
	{
		key: 'nav.goals',
		label: 'Goals',
		href: '/app/goals',
		icon: TargetIcon,
		group: 'Progress',
		description: 'What you are working towards.',
		keywords: ['objectives', 'targets', 'milestones', 'plans'],
		nav: { show: true }
	},
	{
		key: 'nav.reports',
		label: 'Reports',
		href: '/app/reports',
		icon: NotebookIcon,
		group: 'Progress',
		description: 'Weekly reviews and daily briefings.',
		keywords: ['review', 'briefing', 'summary', 'weekly', 'daily'],
		nav: { show: true }
	},
	{
		key: 'nav.weekly',
		label: 'Plan the week',
		href: '/app/weekly',
		icon: CalendarCheckIcon,
		group: 'Progress',
		description: 'Review the week and choose a focus for the next one.',
		keywords: ['weekly', 'review', 'plan', 'priorities', 'focus', 'deload'],
		nav: { show: true }
	},
	{
		key: 'nav.progress-check',
		label: 'Progress check',
		href: '/app/progress',
		icon: RulerIcon,
		group: 'Progress',
		description: 'Photos, weight and measurements on a schedule you choose.',
		keywords: ['measurements', 'waist', 'photos', 'weight', 'body', 'check'],
		nav: { show: true }
	},
	{
		key: 'nav.recap',
		label: 'Your recap',
		href: '/app/recap',
		icon: CalendarCheckIcon,
		group: 'Progress',
		description: 'Your last 7 or 30 days, to keep or to share.',
		keywords: ['recap', 'week', 'month', 'summary', 'share', 'streak']
	},
	{
		key: 'nav.insights',
		label: 'Insights',
		href: '/app/insights',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'How every part of it has been going.',
		keywords: ['charts', 'trends', 'analytics', 'stats', 'score', 'summary'],
		nav: { show: true, label: 'Summary', selfChildLabel: 'Summary' }
	},
	{
		key: 'nav.activity-insights',
		label: 'Activity feed',
		href: '/app/insights/timeline',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'Everything logged, newest first.',
		keywords: ['charts', 'trends', 'timeline', 'feed', 'log', 'analytics'],
		nav: { show: true, label: 'Activity', under: '/app/insights' }
	},
	{
		key: 'nav.body-insights',
		label: 'Body insights',
		href: '/app/insights/body',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'Weight, measurements, and training load.',
		keywords: ['charts', 'trends', 'weight', 'measurements', 'analytics'],
		nav: { show: true, label: 'Body', under: '/app/insights' }
	},
	{
		key: 'nav.mind-insights',
		label: 'Mind insights',
		href: '/app/insights/mind',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'Mood and reflection over time.',
		keywords: ['charts', 'trends', 'mood', 'journal', 'analytics'],
		nav: { show: true, label: 'Mind', under: '/app/insights' }
	},
	{
		key: 'nav.progress-insights',
		label: 'Progress insights',
		href: '/app/insights/progress',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'How your goals are moving.',
		keywords: ['charts', 'trends', 'goals', 'analytics'],
		nav: { show: true, label: 'Progress', under: '/app/insights' }
	},
	{
		key: 'nav.training-insights',
		label: 'Training insights',
		href: '/app/insights/training',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'Volume, frequency, and adherence.',
		keywords: ['charts', 'trends', 'workouts', 'volume', 'analytics'],
		nav: { show: true, label: 'Training', under: '/app/insights' }
	},
	{
		key: 'nav.nutrition-insights',
		label: 'Nutrition insights',
		href: '/app/insights/nutrition',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'Calories and macros against the plan.',
		keywords: ['charts', 'trends', 'calories', 'macros', 'food', 'analytics'],
		nav: { show: true, label: 'Nutrition', under: '/app/insights' }
	},
	{
		key: 'nav.sleep-insights',
		label: 'Sleep insights',
		href: '/app/insights/sleep',
		icon: MoonIcon,
		group: 'Progress',
		description: 'Duration, debt, schedule and stages.',
		keywords: ['sleep', 'bedtime', 'hours', 'stages', 'analytics'],
		nav: { show: true, label: 'Sleep', under: '/app/insights' }
	},
	{
		key: 'nav.cardio-insights',
		label: 'Cardio insights',
		href: '/app/insights/cardio',
		icon: FootprintsIcon,
		group: 'Progress',
		description: 'Distance, pace, records and heart.',
		keywords: ['running', 'pace', 'distance', 'cardio', 'heart', 'analytics'],
		nav: { show: true, label: 'Cardio', under: '/app/insights' }
	},
	{
		key: 'nav.patterns',
		label: 'Patterns',
		href: '/app/insights/patterns',
		icon: SparklesIcon,
		group: 'Progress',
		description: 'What moves together across your days.',
		keywords: ['correlations', 'links', 'caffeine', 'sleep', 'analytics'],
		nav: { show: true, label: 'Patterns', under: '/app/insights' }
	},
	{
		key: 'nav.coach-insights',
		label: 'Coaching insights',
		href: '/app/insights/coach',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'How much you and the coach talked.',
		keywords: ['charts', 'trends', 'chat', 'messages', 'coach', 'analytics'],
		nav: { show: true, label: 'Coaching', under: '/app/insights' }
	},
	{
		key: 'nav.spend-insights',
		label: 'Model spend',
		href: '/app/insights/spend',
		icon: ChartLineIcon,
		group: 'Progress',
		description: 'What your account spent on model calls.',
		keywords: ['charts', 'cost', 'tokens', 'spend', 'usage', 'analytics'],
		nav: { show: true, label: 'Spend', under: '/app/insights' }
	},
	{
		key: 'nav.friends',
		label: 'Friends',
		href: '/app/friends',
		icon: UsersIcon,
		group: 'Progress',
		description: 'People you follow, and your invite link.',
		keywords: ['invite', 'follow', 'followers', 'social', 'people', 'handle'],
		nav: { show: true }
	},
	{
		key: 'nav.leaderboard',
		label: 'Leaderboard',
		href: '/app/friends/leaderboard',
		icon: TrophyIcon,
		group: 'Progress',
		description: 'Your XP and level, ranked with the friends who share theirs.',
		keywords: ['xp', 'level', 'rank', 'ranking', 'points', 'compete', 'streak'],
		nav: { show: true }
	},
	{
		key: 'nav.crews',
		label: 'Crews',
		href: '/app/crews',
		icon: FlagIcon,
		group: 'Progress',
		description: 'A few people keeping each other going.',
		keywords: ['group', 'accountability', 'partner', 'challenge', 'team'],
		nav: { show: true }
	},
	{
		key: 'nav.inbox',
		label: 'Inbox',
		href: '/app/inbox',
		icon: InboxIcon,
		group: 'System',
		description: 'Things saved to sort later, with the coach suggesting where each goes.',
		keywords: ['capture', 'save', 'share', 'later', 'triage', 'notes'],
		nav: { show: true }
	},
	{
		key: 'nav.knowledge',
		label: 'Knowledge',
		href: '/app/knowledge',
		icon: BookOpenIcon,
		group: 'System',
		description: 'Documents and notes North can draw on.',
		keywords: ['documents', 'files', 'pdf', 'notes', 'upload', 'library'],
		nav: { show: true }
	},
	{
		key: 'nav.search-knowledge',
		label: 'Search knowledge',
		href: '/app/knowledge/search',
		icon: SearchIcon,
		group: 'System',
		description: 'Find a passage across everything you have added.',
		keywords: ['documents', 'find', 'passages', 'lookup', 'query']
	},
	{
		key: 'nav.settings',
		label: 'Settings',
		href: '/app/settings',
		icon: SettingsIcon,
		group: 'System',
		description: 'Profile, preferences, and notifications.',
		keywords: ['account', 'profile', 'preferences', 'timezone', 'tone'],
		nav: { show: true }
	},
	{
		key: 'nav.agent-connections',
		label: 'Agent connections',
		href: '/app/settings/connections',
		icon: PlugIcon,
		group: 'System',
		description: 'Tokens for agents that connect over MCP.',
		keywords: ['mcp', 'api', 'token', 'integration', 'claude', 'agents']
	},
	{
		key: 'nav.activity-log',
		label: 'Activity log',
		href: '/app/settings/activity',
		icon: HistoryIcon,
		group: 'System',
		description: 'What happened on your account.',
		keywords: ['audit', 'sessions', 'security', 'history', 'events']
	}
];
