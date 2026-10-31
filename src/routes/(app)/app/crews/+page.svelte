<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { describedBy, FieldMessage } from '#lib/components/ui/field-message/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { crewURL, membersLabel } from '#lib/features/crews/crew.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/crews/crews.templ IndexPage.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	const errors = $derived<Record<string, string>>(form?.errors ?? {});
	let submitting = $state(false);
</script>

<svelte:head><title>{pageTitle(i18n.t('crews.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('crews.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('crews.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('crews.intro')}</p>
	</header>
	{#if data.mine.length > 0}
		<Card.Root class="border-hairline bg-surface">
			<Card.Content class="pt-6">
				<ul class="divide-hairline divide-y">
					{#each data.mine as c (c.id)}
						<li class="flex items-center justify-between py-3">
							<a class="text-sm font-medium hover:underline" href={crewURL(c.id)}>{c.name}</a>
							<span class="text-muted-foreground text-xs">{membersLabel(i18n, c.memberCount)}</span>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('crews.start.title')}</Card.Title>
			<Card.Description>{i18n.t('crews.start.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				class="flex items-end gap-2"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				<div class="flex-1 space-y-2">
					<Label for="name" class={errors.name ? 'text-destructive' : ''}>{i18n.t('crews.name')}</Label>
					<Input
						id="name"
						name="name"
						value={form?.values?.name ?? ''}
						placeholder={i18n.t('crews.name.placeholder')}
						aria-invalid={errors.name ? 'true' : undefined}
						aria-describedby={describedBy('name', errors.name)}
					/>
					<FieldMessage id="name" error={errors.name} />
				</div>
				<Button type="submit" disabled={submitting}>{i18n.t('crews.create')}</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
