<!--
	The conversation list (Go: threadList). Off-canvas below lg, pinned open
	from lg up, so one piece of markup serves both.
-->
<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { components } from '#lib/api/generated/schema.js';
	import CoachKpiStrip from './CoachKpiStrip.svelte';
	import StartForm from './StartForm.svelte';

	type Summary = components['schemas']['ConversationSummary'];

	let {
		list,
		current,
		stats,
		open = $bindable(false)
	}: {
		list: Summary[];
		current: string;
		stats: { threadCount: number; messagesThisWeek: number };
		open?: boolean;
	} = $props();

	const i18n = useI18n();
</script>

<aside
	class={[
		'border-border bg-card absolute inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r transition-transform lg:static lg:z-auto lg:translate-x-0',
		open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
	]}
	data-testid="thread-list"
>
	<div class="border-border space-y-3 border-b p-3">
		<CoachKpiStrip {stats} />
		<div class="space-y-2">
			<StartForm>
				<Button type="submit" variant="outline" size="sm" class="w-full">
					<PlusIcon class="size-4" />
					{i18n.t('chat.new')}
				</Button>
			</StartForm>
			<StartForm kind="reflection">
				<Button type="submit" variant="outline" size="sm" class="w-full">{i18n.t('chat.reflection.start')}</Button>
			</StartForm>
		</div>
	</div>
	<nav class="flex-1 space-y-0.5 overflow-y-auto p-2">
		{#each list as c (c.id)}
			{#if c.id === current}
				<a
					href="/app/chat/{c.id}"
					aria-current="page"
					class="text-foreground relative flex min-h-11 items-center gap-2 truncate rounded-md py-2 pr-3 pl-3 text-sm font-medium before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-signal"
				>
					<span class="min-w-0 truncate">{c.title}</span>
					{#if c.kind === 'reflection'}
						<Badge variant="secondary" class="shrink-0">{i18n.t('chat.reflection')}</Badge>
					{/if}
				</a>
			{:else}
				<a
					href="/app/chat/{c.id}"
					class="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex min-h-11 items-center gap-2 truncate rounded-md px-3 py-2 text-sm transition-colors"
				>
					<span class="min-w-0 truncate">{c.title}</span>
					{#if c.kind === 'reflection'}
						<Badge variant="secondary" class="shrink-0">{i18n.t('chat.reflection')}</Badge>
					{/if}
				</a>
			{/if}
		{/each}
	</nav>
</aside>
{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div onclick={() => (open = false)} class="fixed inset-0 z-20 bg-black/50 lg:hidden"></div>
{/if}
