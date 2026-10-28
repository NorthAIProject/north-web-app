<!--
	What a person sees instead of the analysis they asked for once the video
	analysis budget is spent (north-client web/quota Refused / RefusedFor).
-->
<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { delayLabel } from './view.js';

	let { retryAfterSeconds, class: className = '' }: { retryAfterSeconds: number; class?: string } = $props();
	const i18n = useI18n();
</script>

<Alert.Root variant="destructive" class={className}>
	<TriangleAlertIcon class="size-4" />
	<Alert.Title>{i18n.tf('quota.title', i18n.t('quota.action.media_analysis'))}</Alert.Title>
	<Alert.Description>{i18n.tf('quota.body', delayLabel(i18n, retryAfterSeconds))}</Alert.Description>
</Alert.Root>
