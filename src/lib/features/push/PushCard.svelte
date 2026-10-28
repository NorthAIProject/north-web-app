<!--
	The overview's "turn on nudges" card (Go nextStepCard for the push step +
	push.js data-push-card). Hidden until this browser is known to be able to
	deliver; "Not now" is remembered in this browser only. The card's own
	button is the next step's link (to the notification settings), as in Go;
	children render the card body around it.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PushOptIn, pushDismissed, rememberPushDismissed } from './push.svelte.js';

	let { children }: { children: Snippet<[{ dismiss: () => void }]> } = $props();

	const push = new PushOptIn();
	let dismissed = $state(true);

	$effect(() => {
		dismissed = pushDismissed();
		if (!dismissed) void push.refresh();
	});

	const visible = $derived(!dismissed && (push.state === 'ready' || push.state === 'working' || push.state === 'failed'));

	function dismiss() {
		rememberPushDismissed();
		dismissed = true;
	}
</script>

<div data-push data-push-card hidden={!visible}>
	{@render children({ dismiss })}
</div>
