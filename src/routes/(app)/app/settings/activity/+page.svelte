<!-- What Khepri actually did to this person's data (Go: web/settings/activity.templ). -->
<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
	const timezone = $derived(data.user.timezone || 'UTC');

	/** Where a call came from, in words a person would use (Go: surfaceLabel). */
	function surfaceLabel(s: string): string {
		if (s === 'coach') return i18n.t('settings.activity.surface.coach');
		if (s === 'mcp') return i18n.t('settings.activity.surface.mcp');
		return i18n.t('settings.activity.surface.unknown');
	}
</script>

<svelte:head><title>{pageTitle(i18n.t('settings.activity.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('settings.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('settings.activity.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('settings.activity.intro')}</p>
		<a href="/app/settings" class="text-muted-foreground hover:text-foreground mt-3 inline-block text-sm underline underline-offset-4">
			{i18n.t('settings.activity.back')}
		</a>
	</header>
	{#if data.executions.length === 0}
		<Card.Root>
			<Card.Content>
				<p class="text-muted-foreground text-sm">{i18n.t('settings.activity.empty')}</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<ul class="space-y-3">
			{#each data.executions as e (e.id)}
				<li>
					<Card.Root>
						<Card.Content>
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-mono text-sm">{e.tool}</span>
								{#if e.outcome === 'executed'}
									<Badge>{i18n.t('settings.activity.outcome.done')}</Badge>
								{:else if e.outcome === 'declined'}
									<Badge variant="outline">{i18n.t('settings.activity.outcome.declined')}</Badge>
								{:else}
									<Badge variant="destructive">{i18n.t('settings.activity.outcome.failed')}</Badge>
								{/if}
								<Badge variant="secondary">{surfaceLabel(e.surface)}</Badge>
								<span class="text-muted-foreground ml-auto text-xs">
									{formatTime(i18n.locale, e.createdAt, '2 Jan 2006, 15:04', timezone)}
								</span>
							</div>
							{#if e.arguments !== undefined}
								<!-- The arguments, not just the name: what was written is the question here. -->
								<pre class="text-muted-foreground mt-2 overflow-x-auto rounded bg-muted p-2 font-mono text-xs">{JSON.stringify(e.arguments)}</pre>
							{/if}
							{#if e.detail}
								<p class="text-muted-foreground mt-2 text-xs leading-relaxed">{e.detail}</p>
							{/if}
						</Card.Content>
					</Card.Root>
				</li>
			{/each}
		</ul>
	{/if}
</div>
