<!--
	Khepri reaching somebody's own calendar over MCP (Go: settings.calendarCard).
	The outbound direction: a credential Khepri uses to call out.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import FieldDescription from './FieldDescription.svelte';
	import { FieldMessage } from '#lib/components/ui/field-message/index.js';
	import type { CalendarSettings } from './types.js';

	let { calendar, error = '' }: { calendar: CalendarSettings; error?: string } = $props();

	const i18n = useI18n();
	const connected = $derived(calendar.connected);
</script>

{#if calendar.enabled}
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('conn.cal.title')}</Card.Title>
			<Card.Description>{i18n.t('conn.cal.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if connected}
				<div class="space-y-3">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div class="min-w-0">
							<p class="truncate font-mono text-sm">{connected.endpoint}</p>
							{#if connected.status === 'ok'}
								<p class="text-muted-foreground mt-1 text-xs">{i18n.t('settings.conn.cal.healthy')}</p>
							{:else}
								<p class="mt-1 text-xs text-destructive">{connected.lastError}</p>
							{/if}
						</div>
						<form method="post" action="?/calendarDisconnect" use:enhance>
							<Button type="submit" variant="outline" size="sm">{i18n.t('conn.tg.disconnect')}</Button>
						</form>
					</div>
				</div>
			{:else}
				<form method="post" action="?/calendar" class="space-y-4" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<FieldMessage id="calendar" {error} />
					<div class="space-y-2">
						<Label for="endpoint">{i18n.t('conn.cal.endpoint')}</Label>
						<Input id="endpoint" name="endpoint" type="text" placeholder="https://calendar.example.com/mcp" />
						<FieldDescription>{i18n.t('conn.cal.endpoint.desc')}</FieldDescription>
					</div>
					<div class="space-y-2">
						<Label for="token">{i18n.t('conn.cal.token')}</Label>
						<Input id="token" name="token" type="password" placeholder={i18n.t('conn.cal.token.ph')} />
						<FieldDescription>{i18n.t('conn.cal.token.desc')}</FieldDescription>
					</div>
					<Button type="submit">{i18n.t('conn.cal.connect')}</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
