<!--
	Connects a Telegram chat to this account (Go: settings.telegramCard). One
	state at a time: linked, holding a fresh code, or offering to make one.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import CopyBlock from './CopyBlock.svelte';
	import type { TelegramSettings } from './types.js';

	let { telegram, code = '', timezone }: { telegram: TelegramSettings; code?: string; timezone: string } = $props();

	const i18n = useI18n();
	const botLink = $derived(telegram.botUsername ? `https://t.me/${telegram.botUsername}` : '');
	// Telegram delivers this as "/start CODE", which redeem accepts.
	const startLink = $derived(
		telegram.botUsername && code ? `https://t.me/${telegram.botUsername}?start=${encodeURIComponent(code)}` : ''
	);
	const date = (t: string, layout: string) => formatTime(i18n.locale, t, layout, timezone);
</script>

{#snippet howTo(hasCode: boolean)}
	<ol class="text-muted-foreground list-decimal space-y-2 pl-5 text-sm leading-relaxed">
		<li>{i18n.t('settings.conn.tg.step1')}</li>
		<li>
			{#if botLink}
				{i18n.t('settings.conn.tg.step2.open')}
				<a href={botLink} target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-4">@{telegram.botUsername}</a>
				{i18n.t('settings.conn.tg.step2.rest')}
			{:else}
				{i18n.t('conn.tg.manual')}
			{/if}
		</li>
		<li>{hasCode ? i18n.t('settings.conn.tg.step3.code') : i18n.t('settings.conn.tg.step3.start')}</li>
		<li>{i18n.t('settings.conn.tg.step4')}</li>
	</ol>
{/snippet}

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('conn.tg.title')}</Card.Title>
		<Card.Description>{i18n.t('conn.tg.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if telegram.linked}
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-signal text-sm font-medium">{i18n.t('settings.conn.tg.connected')}</p>
					<p class="text-muted-foreground mt-0.5 text-xs">
						{#if telegram.linkedAt}{i18n.tf('conn.tg.linked', date(telegram.linkedAt, '2 Jan 2006'))}{/if}
						{#if telegram.lastSeenAt}
							· {i18n.tf('settings.conn.tg.lastmsg', date(telegram.lastSeenAt, '2 Jan, 15:04'))}
						{:else}
							· {i18n.t('settings.conn.tg.nomsg')}
						{/if}
					</p>
				</div>
				<!-- Asks first: disconnecting is instant, and the way back is another code. -->
				<Dialog.Root>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>{i18n.t('conn.tg.disconnect')}</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>{i18n.t('conn.tg.disconnect.title')}</Dialog.Title>
							<Dialog.Description>{i18n.t('conn.tg.disconnect.desc')}</Dialog.Description>
						</Dialog.Header>
						<Dialog.Footer>
							<Dialog.Close class={buttonVariants({ variant: 'outline' })}>{i18n.t('settings.conn.tg.keep')}</Dialog.Close>
							<form method="post" action="?/telegramDisconnect" use:enhance>
								<Button type="submit" variant="destructive">{i18n.t('conn.tg.disconnect')}</Button>
							</form>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		{:else if code}
			<!-- Loud: the code is stored only as a hash, so this is its one appearance. -->
			<div class="space-y-4">
				<div class="border-signal/40 bg-signal/5 space-y-3 rounded-lg border p-4">
					<p class="text-muted-foreground text-sm leading-relaxed">{i18n.t('conn.tg.tap')}</p>
					{#if startLink}
						<Button href={startLink} target="_blank">{i18n.t('conn.tg.open')}</Button>
					{/if}
					<CopyBlock heading={i18n.t('settings.conn.tg.code.copy')} id="telegram-code" lang="text" body={code} />
				</div>
				{@render howTo(true)}
			</div>
		{:else}
			<div class="space-y-4">
				{@render howTo(false)}
				<form method="post" action="?/telegramCode" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<Button type="submit">{i18n.t('conn.tg.code')}</Button>
				</form>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
