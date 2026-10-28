<!-- Shown on a plan that is not the one being followed (north-client week.templ FollowCard). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	let { planID }: { planID: string } = $props();
	const i18n = useI18n();
</script>

<Card.Root class="mb-6">
	<Card.Content class="flex flex-wrap items-center justify-between gap-3 pt-6">
		<p class="text-muted-foreground text-sm">{i18n.t('workouts.follow.lede')}</p>
		<form method="post" action="/app/training/{planID}/activate" use:enhance>
			<Button size="sm" type="submit">{i18n.t('workouts.follow.button')}</Button>
		</form>
	</Card.Content>
</Card.Root>
