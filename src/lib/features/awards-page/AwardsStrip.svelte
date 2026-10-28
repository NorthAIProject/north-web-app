<script lang="ts">
	// The awards shelf on a profile: the newest coins and a link to the full
	// page; nothing at all when there is nothing to show (Go: web/awards Strip).
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import AwardCoin from './AwardCoin.svelte';
	import type { AwardView } from './awards.js';

	let { handle, awards }: { handle: string; awards: AwardView[] } = $props();
	const i18n = useI18n();
</script>

{#if awards.length > 0}
	<Card.Root class="border-hairline bg-surface" id="profile-awards">
		<Card.Header>
			<Card.Title>{i18n.t('awards.profile.title')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul class="flex flex-wrap gap-3">
				{#each awards as a (a.id)}
					<li title={a.name}>
						<AwardCoin award={a} size={44} />
					</li>
				{/each}
			</ul>
			<div class="mt-3">
				<Button href="/app/u/{encodeURIComponent(handle)}/awards" variant="ghost" size="sm">
					{i18n.t('awards.profile.all')}
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
