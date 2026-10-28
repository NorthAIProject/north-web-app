<!--
	Leaving with your data and leaving altogether, in one place (Go:
	settings.yourDataCard + deleteAccountDialog). The confirmation is the
	account's own email: an account held by a passkey or Google has no password.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import FieldMessage from './FieldMessage.svelte';

	let { email, deleteError = '' }: { email: string; deleteError?: string } = $props();

	const i18n = useI18n();
	let open = $state(false);
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('settings.data.title')}</Card.Title>
		<Card.Description>{i18n.t('settings.data.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="space-y-6">
			<div class="space-y-3">
				<p class="text-muted-foreground text-sm leading-relaxed">{i18n.t('settings.data.export.desc')}</p>
				<!-- A download, not a page: the router must not try to render it. -->
				<Button href="/app/settings/export.zip" variant="outline" data-sveltekit-reload>{i18n.t('settings.data.download')}</Button>
			</div>
			<div class="border-hairline space-y-3 border-t pt-6">
				<p class="text-muted-foreground text-sm leading-relaxed">{i18n.t('settings.delete.desc')}</p>
				<FieldMessage message={deleteError} />
				<Dialog.Root bind:open>
					<Dialog.Trigger class={buttonVariants({ variant: 'destructive' })}>
						{i18n.t('settings.delete.button')}
					</Dialog.Trigger>
					<Dialog.Content>
						<form
							method="post"
							action="?/deleteAccount"
							use:enhance={() => async ({ result, update }) => {
								if (result.type === 'failure') open = false;
								await update();
							}}
						>
							<Dialog.Header>
								<Dialog.Title>{i18n.t('settings.delete.title')}</Dialog.Title>
								<Dialog.Description>{i18n.t('settings.delete.dialog')}</Dialog.Description>
							</Dialog.Header>
							<div class="py-4">
								<div class="space-y-2">
									<Label for="confirm_email">{i18n.tf('settings.delete.confirm', email)}</Label>
									<Input id="confirm_email" name="confirm_email" type="email" required placeholder={email} />
								</div>
							</div>
							<Dialog.Footer>
								<Dialog.Close class={buttonVariants({ variant: 'outline' })}>
									{i18n.t('settings.delete.keep')}
								</Dialog.Close>
								<Button type="submit" variant="destructive">{i18n.t('settings.delete.go')}</Button>
							</Dialog.Footer>
						</form>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</div>
	</Card.Content>
</Card.Root>
