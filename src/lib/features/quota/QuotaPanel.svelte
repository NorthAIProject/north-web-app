<!--
	The quota refusal (Go web/quota Refused / RefusedFor), in place of the
	thing that asked for the work. Feed it quotaRefusal(err) from a failed API
	call or a form action's fail(429, { quota }):

		{#if refusal}<QuotaPanel {...refusal} />{/if}

	Without an action (an API that predates the code) it shows the API's own
	sentence instead of the two-line panel.
-->
<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { actionLabel, delayLabel } from './quota.js';

	let { action, retryAfter, message = '' }: { action: string; retryAfter: number; message?: string } = $props();
	const i18n = useI18n();
</script>

<Alert.Root variant="destructive" data-testid="quota-refused">
	<TriangleAlertIcon class="size-4" />
	{#if action}
		<Alert.Title>{i18n.tf('quota.title', actionLabel(i18n, action))}</Alert.Title>
		<Alert.Description>{i18n.tf('quota.body', delayLabel(i18n, retryAfter))}</Alert.Description>
	{:else}
		<Alert.Title>{message}</Alert.Title>
	{/if}
</Alert.Root>
