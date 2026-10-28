<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import NameLink from './NameLink.svelte';
	import { at, initials } from './format.js';

	// Go: personRow — avatar, name (linked to the profile), handle, actions.
	let {
		person,
		children
	}: { person: { displayName: string; handle: string }; children?: Snippet } = $props();
	const i18n = useI18n();
</script>

<li class="flex items-center gap-3 py-3">
	<Avatar.Root>
		<Avatar.Fallback>{initials(person.displayName)}</Avatar.Fallback>
	</Avatar.Root>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">
			<NameLink name={person.displayName} handle={person.handle} />
		</p>
		<p class="truncate text-xs text-muted-foreground">{at(i18n, person.handle)}</p>
	</div>
	<div class="flex gap-1">
		{@render children?.()}
	</div>
</li>
