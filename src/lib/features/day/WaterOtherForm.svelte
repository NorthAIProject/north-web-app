<!--
	Logs an amount the presets do not cover (web/day dialogs.templ
	waterOtherForm). Its own form: the preset buttons submit amount_ml as
	their value, and two amount_ml fields in one form would leave which one
	counts to the order of the markup.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import DropletIcon from '@lucide/svelte/icons/droplet';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { quickSubmit } from './forms.js';

	let { testId, done }: { testId: string; done?: () => void } = $props();
	const i18n = useI18n();
</script>

<form method="post" action="?/water" class="flex items-center gap-2" data-testid={testId} use:enhance={quickSubmit(i18n, done)}>
	<Input name="amount_ml" type="number" placeholder="ml" class="w-24" min="1" max="5000" required inputmode="numeric" aria-label={i18n.t('day.water.other')} />
	<Button type="submit" variant="outline">
		<DropletIcon class="text-day-water size-4" />
		{i18n.t('day.add.short')}
	</Button>
</form>
