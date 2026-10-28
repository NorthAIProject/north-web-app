<script lang="ts">
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import QuickAdd from './QuickAdd.svelte';
	import type { DayView } from './view.js';

	let { data }: { data: DayView } = $props();
	const i18n = useI18n();
</script>

<!-- The bar spans the viewport to centre the pill; only the pill takes clicks,
     so the sidebar footer (Sign out) underneath stays reachable. Go's bar
     swallowed those clicks. -->
<nav class="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4" aria-label={i18n.t('day.tabs')}>
	<div class="pointer-events-auto bg-background/90 border-hairline flex items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur">
		<Button href="/app" variant="secondary" size="sm" class="rounded-full" aria-current="page"><CalendarDaysIcon class="size-4" />{i18n.t('day.tab.day')}</Button>
		<Button href="/app/overview" variant="ghost" size="sm" class="rounded-full"><LayoutDashboardIcon class="size-4" />{i18n.t('day.tab.overview')}</Button>
		<Button href="/app/insights/timeline" variant="ghost" size="sm" class="rounded-full"><FolderOpenIcon class="size-4" />{i18n.t('day.tab.records')}</Button>
		<QuickAdd {data} />
	</div>
</nav>
