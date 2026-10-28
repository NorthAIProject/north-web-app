<!--
	The Web Push opt-in row for the settings notifications card (Go
	web/settings pushRow + push.js). Outside the notifications form on
	purpose: subscribing is a permission prompt followed by a JSON call, not a
	field to save. Mount it after the form, as Go does:

		<PushRow />

	It renders nothing until /push/config says push is configured here (Go
	only drew the row when f.PushEnabled).
-->
<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { PUSH_HINTS, PushOptIn } from './push.svelte.js';

	const i18n = useI18n();
	const push = new PushOptIn();

	$effect(() => {
		void push.refresh();
	});

	const hint = $derived(
		push.state === 'checking' ? i18n.t('settings.push.checking') : PUSH_HINTS[push.state]
	);
</script>

{#if push.available}
	<Separator />
	<div class="space-y-3" data-push>
		<div>
			<p class="text-sm font-medium">{i18n.t('settings.push.title')}</p>
			<p class="text-xs text-muted-foreground" data-push-hint>{hint}</p>
		</div>
		{#if push.state === 'ready'}
			<div>
				<Button variant="outline" onclick={() => push.enable()}
					>{i18n.t('settings.push.enable')}</Button
				>
			</div>
		{:else if push.state === 'subscribed'}
			<div class="flex flex-wrap items-center gap-3">
				<Badge variant="outline" class="border-signal/40 bg-signal/12 text-signal"
					>{i18n.t('settings.push.on')}</Badge
				>
				<Button variant="outline" size="sm" onclick={() => push.disable()}
					>{i18n.t('settings.push.disable')}</Button
				>
			</div>
		{:else if push.state === 'failed'}
			<div>
				<Button variant="outline" onclick={() => push.enable()}
					>{i18n.t('settings.push.retry')}</Button
				>
			</div>
		{/if}
		{#if push.devices > 0}
			<p class="text-xs text-muted-foreground">
				{push.devices === 1
					? i18n.t('settings.push.devices.one')
					: i18n.tf('settings.push.devices.many', push.devices)}
			</p>
		{/if}
	</div>
{/if}
