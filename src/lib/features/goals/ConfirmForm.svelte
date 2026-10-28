<!--
	A destructive form that asks first (Go: `@submit="if (!confirm(...))
	$event.preventDefault()"`). With JavaScript the submit button opens a
	Dialog and only its confirm button posts the form; without, the button
	posts directly, as the Go page did with Alpine absent.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	let {
		id,
		action,
		message,
		confirmLabel,
		trigger,
		fields
	}: {
		id: string;
		action: string;
		/** The question, as Go passed it to confirm(). */
		message: string;
		confirmLabel: string;
		/** The submit button's content; gets the button props to spread. */
		trigger: Snippet<[props: { type: 'submit'; onclick: (e: MouseEvent) => void; disabled: boolean }]>;
		/** Hidden inputs. */
		fields?: Snippet;
	} = $props();

	const i18n = useI18n();
	let open = $state(false);
	let busy = $state(false);
</script>

<form
	{id}
	method="post"
	{action}
	use:enhance={() => {
		busy = true;
		open = false;
		return async ({ update }) => {
			await update();
			busy = false;
		};
	}}
>
	{@render fields?.()}
	{@render trigger({
		type: 'submit',
		disabled: busy,
		onclick: (e) => {
			e.preventDefault();
			open = true;
		}
	})}
</form>
<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Description class="text-foreground text-sm">{message}</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>{i18n.t('goals.cancel')}</Button>
			<Button type="submit" form={id} variant="destructive" disabled={busy}>{confirmLabel}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
