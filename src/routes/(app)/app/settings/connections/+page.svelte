<!-- Agent connections and the model provider (Go: web/settings/connections.templ ConnectionsPage). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import { CopyButton } from '#lib/components/ui/copybutton/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import CalendarCard from '#lib/features/settings/CalendarCard.svelte';
	import ConnectCard from '#lib/features/settings/ConnectCard.svelte';
	import ConnectionStatus from '#lib/features/settings/ConnectionStatus.svelte';
	import CopyBlock from '#lib/features/settings/CopyBlock.svelte';
	import ProviderCard from '#lib/features/settings/ProviderCard.svelte';
	import TelegramCard from '#lib/features/settings/TelegramCard.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	// One client per page instance (never module-level: SSR would share it),
	// for the "waiting for first use" polls.
	const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

	const timezone = $derived(data.user.timezone || 'UTC');
	const list = $derived(data.connections.connections);
	const issued = $derived(form?.form === 'create' && 'issued' in form ? form.issued : undefined);
	const createFailed = $derived(form?.form === 'create' && 'errors' in form ? form : undefined);
	const telegramCode = $derived(form?.form === 'telegram' && 'telegramCode' in form ? form.telegramCode : '');
	const calendarError = $derived(form?.form === 'calendar' && 'message' in form ? form.message : '');
	const aiFailed = $derived(form?.form === 'ai' && 'errors' in form ? form : undefined);
	// A manual-key submission with errors opens the collapsed card again.
	let manualOpen = $derived(Boolean(createFailed));

	const copied = () => {
		const ph = (window as { posthog?: { capture: (e: string, p: object) => void } }).posthog;
		ph?.capture('mcp_connector_url_copied', { surface: 'settings' });
	};
	// An OAuth access token lasts an hour and is replaced in place: a past
	// expiry means "needs refreshing", not "gone".
	const expired = (at?: string) => Boolean(at && new Date(at).getTime() < Date.now());
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.agent-connections'))}</title></svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
		<header>
			<MonoLabel text={i18n.t('settings.mono')} />
			<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('nav.agent-connections')}</h1>
			<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('conn.intro')}</p>
			<a
				href="/app/settings"
				class="text-muted-foreground hover:text-foreground mt-3 inline-block text-sm underline underline-offset-4"
			>
				{i18n.t('conn.back')}
			</a>
		</header>

		{#if issued}
			<!-- The loudest thing on the page: the one moment this token exists outside the agent. -->
			<Card.Root class="border-signal/40 bg-signal/5">
				<Card.Header>
					<Card.Title>{i18n.tf('conn.issued.ready', issued.connection.name)}</Card.Title>
					<Card.Description>{i18n.t('conn.issued.desc')}</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-5">
						<CopyBlock heading={i18n.t('conn.issued.key')} id="issued-token" lang="text" body={issued.token} />
						<CopyBlock
							heading={issued.setup.configLabel ?? ''}
							id="issued-config"
							lang={issued.setup.configLang ?? ''}
							body={issued.setup.config ?? ''}
						/>
						{#if issued.setup.safe}
							<div>
								<p class="text-muted-foreground mb-2 text-sm leading-relaxed">{issued.setup.safeNote}</p>
								<CopyBlock
									heading={issued.setup.safeLabel ?? ''}
									id="issued-safe"
									lang={issued.setup.safeLang ?? ''}
									body={issued.setup.safe}
								/>
								<CopyBlock heading={i18n.t('conn.issued.env')} id="issued-export" lang="bash" body={issued.setup.export ?? ''} />
							</div>
						{/if}
						<div>
							<p class="text-muted-foreground mb-2 text-sm leading-relaxed">{i18n.t('conn.issued.prompt.note')}</p>
							<CopyBlock heading={i18n.t('conn.issued.prompt')} id="issued-prompt" lang="text" body={issued.setup.prompt ?? ''} />
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- One value to paste; manual keys are collapsed beneath it. -->
		<Card.Root class="border-signal/40 bg-signal/5">
			<Card.Header>
				<Card.Title>{i18n.t('conn.url.title')}</Card.Title>
				<Card.Description>{i18n.t('conn.url.desc')}</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center gap-2">
					<code
						id="connector-url"
						class="border-hairline bg-background min-w-0 flex-1 truncate rounded-md border px-3 py-2 font-mono text-sm"
						>{data.connections.connectorUrl}</code
					>
					<CopyButton targetId="connector-url" oncopied={copied} />
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('conn.list.title')}</Card.Title>
				<Card.Description>{i18n.t('conn.list.desc')}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if list.length === 0}
					<p class="text-muted-foreground text-sm leading-relaxed">{i18n.t('conn.list.empty')}</p>
				{:else}
					<ul class="divide-hairline divide-y">
						{#each list as conn (conn.id)}
							<li class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{conn.name}</p>
									<p class="text-muted-foreground mt-0.5 font-mono text-xs">{conn.kindLabel} · {conn.tokenPrefix}…</p>
									<p class="text-muted-foreground mt-0.5 text-xs">
										{i18n.tf('settings.conn.added', formatTime(i18n.locale, conn.createdAt, '2 Jan 2006', timezone))} ·
										<ConnectionStatus id={conn.id} lastUsedAt={conn.lastUsedAt} {timezone} />
										{#if expired(conn.expiresAt)}
											<span class="text-muted-foreground">· {i18n.t('conn.list.expired')}</span>
										{/if}
									</p>
								</div>
								<!-- Revoking is instant and cannot be undone, so it asks first. -->
								<Dialog.Root>
									<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>{i18n.t('conn.revoke')}</Dialog.Trigger>
									<Dialog.Content>
										<Dialog.Header>
											<Dialog.Title>{i18n.tf('conn.revoke.title', conn.name)}</Dialog.Title>
											<Dialog.Description>{i18n.t('conn.revoke.desc')}</Dialog.Description>
										</Dialog.Header>
										<Dialog.Footer>
											<Dialog.Close class={buttonVariants({ variant: 'outline' })}>{i18n.t('conn.keep')}</Dialog.Close>
											<form method="post" action="?/revoke" use:enhance>
												<input type="hidden" name="id" value={conn.id} />
												<Button type="submit" variant="destructive">{i18n.t('conn.revoke')}</Button>
											</form>
										</Dialog.Footer>
									</Dialog.Content>
								</Dialog.Root>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>

		<Collapsible.Root bind:open={manualOpen}>
			<Collapsible.Trigger>{i18n.t('conn.url.manual')}</Collapsible.Trigger>
			<Collapsible.Content>
				<ConnectCard
					previews={data.connections.previews}
					kind={createFailed?.values?.kind}
					name={createFailed?.values?.name}
					errors={createFailed?.errors}
				/>
			</Collapsible.Content>
		</Collapsible.Root>

		{#if data.telegram.enabled}
			<TelegramCard telegram={data.telegram} code={telegramCode} {timezone} />
			<CalendarCard calendar={data.calendar} error={calendarError} />
		{/if}
		<ProviderCard ai={data.ai} values={aiFailed?.values} errors={aiFailed?.errors} />
	</div>
</QueryClientProvider>
