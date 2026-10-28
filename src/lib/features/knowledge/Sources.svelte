<!--
	A coach reply's sources disclosure (Go: web/chat sources + GET
	/app/knowledge/passages). One button per reply rather than a chip per
	citation: the passages are only resolved for the reply somebody decides to
	check. On click the button is replaced by the passages, as htmx's outerHTML
	swap did.

	refs are the message's evidenceRefs as stored ("chunk:<id>", "memory:<id>");
	the API keeps the chunk ones and resolves them against the signed-in user.
-->
<script lang="ts">
	import { knowledgePassages } from './api.js';
	import Passages from './Passages.svelte';
	import type { KnowledgeHit } from './types.js';

	let { refs, label }: { refs: string[]; label: string } = $props();

	let hits = $state<KnowledgeHit[] | null>(null);
	let loading = $state(false);
	let failed = $state(false);

	async function open() {
		if (loading) return;
		loading = true;
		failed = false;
		try {
			hits = await knowledgePassages(refs);
		} catch {
			// htmx left the button in place on an error; so does this.
			failed = true;
		} finally {
			loading = false;
		}
	}
</script>

{#if hits}
	<Passages {hits} />
{:else}
	<button
		type="button"
		class="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
		aria-busy={loading}
		data-failed={failed || undefined}
		onclick={open}
	>
		{label}
	</button>
{/if}
