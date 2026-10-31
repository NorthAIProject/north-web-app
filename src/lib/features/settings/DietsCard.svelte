<!-- Dietary preferences (Go: settings.dietsCard, backed by meals.DietPreferenceService). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	let { diets }: { diets: { id: string; name: string; selected: boolean }[] } = $props();

	const i18n = useI18n();
</script>

<Card.Root class="border-hairline bg-surface" id="diets">
	<Card.Header>
		<Card.Title>{i18n.t('settings.diets.title')}</Card.Title>
		<Card.Description>{i18n.t('settings.diets.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="post" action="?/diets" class="space-y-4" use:enhance={() => async ({ update }) => update({ reset: false })}>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each diets as d (d.id)}
					<label class="flex items-center gap-2 text-sm">
						<Checkbox name="diet_ids" value={d.id} checked={d.selected} />
						{d.name}
					</label>
				{/each}
			</div>
			<Button type="submit">{i18n.t('settings.diets.save')}</Button>
		</form>
	</Card.Content>
</Card.Root>
