<!--
	The record: a flat, numbered list of what somebody did, newest first, ten to
	a page (Go: web/fitness/activities.templ ActivitySessions). Every pager
	control is a real link; onPage lets the page swap just this list in place,
	so the chart above keeps its canvas.
-->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Pagination from '#lib/components/ui/pagination/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import {
		ELLIPSIS,
		firstOf,
		lastOf,
		routeDayKey,
		routeSummary,
		routeWhen,
		sessionPageNumbers,
		sessionsPageURL,
		stravaActivityURL,
		type SessionPage
	} from './activities.js';

	let {
		page,
		timeZone,
		onPage
	}: { page: SessionPage; timeZone: string; onPage?: (n: number, event: MouseEvent) => void } =
		$props();
	const i18n = useI18n();

	// The day a "Show" button picked; its sessions are tinted. (Go wired this
	// to the terrain's Alpine scope, which the page no longer has.)
	let selected = $state('');

	const go = (n: number) => (event: MouseEvent) => onPage?.(n, event);
</script>

<div id="activity-sessions" class="mt-6">
	{#if page.sessions.length === 0}
		<MonoLabel text={i18n.t('fitness.act.nothing')} />
	{:else}
		<ul class="divide-y divide-border">
			{#each page.sessions as session, i (i)}
				{@const day = routeDayKey(session, timeZone)}
				{@const url = stravaActivityURL(session)}
				<li
					class={[
						'flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5',
						day && selected === day && 'bg-signal/5'
					]}
					data-day={day || undefined}
				>
					<span class="w-28 shrink-0 font-mono text-[11px] text-muted-foreground">
						{routeWhen(i18n, session, timeZone)}
					</span>
					<Badge variant="secondary" class="text-[10px]">{session.sport}</Badge>
					{#if url}
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							class="min-w-0 flex-1 truncate text-sm hover:underline">{session.name}</a
						>
					{:else}
						<span class="min-w-0 flex-1 truncate text-sm">{session.name}</span>
					{/if}
					<span class="font-mono text-[11px] text-muted-foreground"
						>{routeSummary(i18n, session)}</span
					>
					{#if day}
						<Button
							variant="ghost"
							size="sm"
							class="h-6 shrink-0 px-2 font-mono text-[10px] tracking-[0.14em] uppercase"
							aria-pressed={selected === day}
							onclick={() => (selected = selected === day ? '' : day)}
						>
							{i18n.t('fitness.act.show')}
						</Button>
					{/if}
				</li>
			{/each}
		</ul>
		<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
			<MonoLabel text={i18n.tf('fitness.act.range', firstOf(page), lastOf(page), page.total)} />
			{#if page.totalPages > 1}
				<Pagination.Root>
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.Previous
								href={sessionsPageURL(page.page - 1)}
								disabled={page.page <= 1}
								label={i18n.t('fitness.act.newer')}
								onclick={go(page.page - 1)}
							/>
						</Pagination.Item>
						{#each sessionPageNumbers(page) as n, i (i)}
							<Pagination.Item>
								{#if n === ELLIPSIS}
									<Pagination.Ellipsis />
								{:else}
									<Pagination.Link
										href={sessionsPageURL(n)}
										isActive={n === page.page}
										onclick={go(n)}
									>
										{n}
									</Pagination.Link>
								{/if}
							</Pagination.Item>
						{/each}
						<Pagination.Item>
							<Pagination.Next
								href={sessionsPageURL(page.page + 1)}
								disabled={page.page >= page.totalPages}
								label={i18n.t('fitness.act.older')}
								onclick={go(page.page + 1)}
							/>
						</Pagination.Item>
					</Pagination.Content>
				</Pagination.Root>
			{/if}
		</div>
	{/if}
</div>
