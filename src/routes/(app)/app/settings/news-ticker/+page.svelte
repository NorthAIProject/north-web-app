<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/news SettingsPage.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const s = $derived(data.settings);
	let toggleForm = $state<HTMLFormElement>();
</script>

<svelte:head><title>{pageTitle(i18n.t('news.settings.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">{i18n.t('news.settings.title')}</h1>
		<p class="mt-1 text-sm text-muted-foreground">{i18n.t('news.settings.intro')}</p>
	</div>

	<Card.Root class="border-hairline bg-surface">
		<Card.Content class="pt-6">
			<!-- Go submitted on change; the noscript button is the no-JS path. -->
			<form
				method="post"
				action="?/toggle"
				class="flex items-center justify-between gap-4"
				bind:this={toggleForm}
				use:enhance
			>
				<div>
					<p class="font-medium">{i18n.t('news.settings.toggle')}</p>
					<p class="text-sm text-muted-foreground">{i18n.t('news.settings.toggle.desc')}</p>
				</div>
				<Switch
					id="news-ticker-enabled"
					name="enabled"
					checked={s.enabled}
					aria-label={i18n.t('news.settings.toggle')}
					onCheckedChange={() => queueMicrotask(() => toggleForm?.requestSubmit())}
				/>
				<noscript>
					<Button type="submit" variant="outline" size="sm">{i18n.t('news.settings.save')}</Button>
				</noscript>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('news.settings.feeds')}</Card.Title>
			<Card.Description>
				{i18n.t('news.settings.feeds.desc')}
				{i18n.tf('news.settings.feeds.used', s.feeds.length, s.maxFeeds)}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if s.feeds.length > 0}
				<ul class="mb-4 divide-y divide-border" role="list">
					{#each s.feeds as feed (feed.id)}
						<li class="flex items-center justify-between gap-3 py-2 text-sm" data-feed={feed.id}>
							<div class="min-w-0">
								{#if feed.title}
									<p class="truncate font-medium">{feed.title}</p>
								{/if}
								<p class="truncate text-muted-foreground">{feed.url}</p>
							</div>
							<form method="post" action="?/remove" use:enhance>
								<input type="hidden" name="feed" value={feed.id} />
								<Button type="submit" variant="ghost" size="sm"
									>{i18n.t('news.settings.remove')}</Button
								>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
			{#if s.feeds.length < s.maxFeeds}
				<form method="post" action="?/add" class="space-y-3" use:enhance>
					<div class="space-y-2">
						<Label for="news-feed-url">{i18n.t('news.settings.url')}</Label>
						<Input
							id="news-feed-url"
							name="url"
							type="url"
							value={form?.url ?? ''}
							placeholder="https://"
							aria-invalid={form?.error ? true : undefined}
						/>
						{#if form?.error}
							<p class="text-sm font-medium text-destructive">{form.error}</p>
						{/if}
					</div>
					<Button type="submit">{i18n.t('news.settings.add')}</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
