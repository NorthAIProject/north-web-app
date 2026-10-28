<script lang="ts">
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import Mascot from '#lib/components/khepri/Mascot.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/onboarding/onboarding.templ DonePage.
	let { data }: PageProps = $props();
	const i18n = useI18n();

	const connectOptions = [
		{ href: '/app/fitness', key: 'onboarding.done.connect.strava' },
		{ href: '/app/settings/connections', key: 'onboarding.done.connect.telegram' },
		{ href: '/app/knowledge', key: 'onboarding.done.connect.upload' },
		{ href: '/app', key: 'onboarding.done.connect.manual' }
	];
</script>

<AuthShell title={i18n.t('onboarding.done.page')} wide>
	<Card.Root>
		<Card.Header>
			<!-- The one place a gesture fires on mount: finishing setup is worth a celebrate. -->
			<div class="flex justify-center pb-2">
				<Mascot size="lg" gesture="celebrate" />
			</div>
			<Card.Title>{i18n.tf('onboarding.done.title', data.firstName)}</Card.Title>
			<Card.Description>
				{i18n.t(data.thread ? 'onboarding.done.writing' : 'onboarding.done.ready')}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-3">
				{#if data.thread}
					<Button href="/app/chat/{data.thread}" class="w-full bg-signal text-background hover:bg-signal/90">
						{i18n.t('onboarding.done.read')}
					</Button>
				{:else}
					<!-- Go posted to /app/chat; here that route's start action. -->
					<form method="post" action="/app/chat?/start">
						<Button type="submit" class="w-full bg-signal text-background hover:bg-signal/90">
							{i18n.t('onboarding.done.talk')}
						</Button>
					</form>
				{/if}
				{#if !data.connect}
					<Button href="/app" variant="outline" class="w-full">{i18n.t('onboarding.done.dashboard')}</Button>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
	{#if data.connect}
		<Card.Root class="mt-4">
			<Card.Header>
				<Card.Title>{i18n.t('onboarding.done.connect.title')}</Card.Title>
				<Card.Description>{i18n.t('onboarding.done.connect.desc')}</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each connectOptions as option (option.key)}
						<Button href={option.href} variant="outline" class="w-full">{i18n.t(option.key)}</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</AuthShell>
