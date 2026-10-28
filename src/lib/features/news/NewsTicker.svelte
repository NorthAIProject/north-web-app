<!--
	The breaking-news strip (Go web/news TickerShell + TickerPanel): loaded
	after the page and refreshed every five minutes. Off, empty or failing
	renders nothing, so the space collapses; the strip is ambient.
-->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { tickerQuery, timeAgo } from './news.js';

	const i18n = useI18n();
	const ticker = createQuery(() => tickerQuery());
	let now = $state(new Date());

	$effect(() => {
		if (ticker.dataUpdatedAt) now = new Date();
	});

	const items = $derived(ticker.data?.enabled ? ticker.data.items : []);
</script>

<div id="news-ticker">
	{#if items.length > 0}
		<Card.Root class="border-hairline bg-surface" data-testid="news-ticker">
			<Card.Header class="flex flex-row items-start justify-between gap-4">
				<div>
					<Card.Title>{i18n.t('news.ticker.title')}</Card.Title>
					<Card.Description>{i18n.t('news.ticker.attribution')}</Card.Description>
				</div>
				<Button href="/app/settings/news-ticker" variant="ghost" size="sm">{i18n.t('news.ticker.manage')}</Button>
			</Card.Header>
			<Card.Content>
				<ul class="divide-border divide-y" role="list">
					{#each items as it (it.url)}
						<li class="py-2">
							<a href={it.url} target="_blank" rel="noopener" class="block hover:underline">
								<span class="text-muted-foreground block text-xs">
									{#if it.source}{it.source}{' · '}{/if}{timeAgo(i18n, it.publishedAt, now)}
								</span>
								<span class="text-sm font-medium">{it.title}</span>
							</a>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
