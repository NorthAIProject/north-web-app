<!--
	The microphone beside a text box (north-client web/shared/ui/dictate.Button
	+ dictate.js).

	<Dictate target="message" variant="outline" />

	Renders nothing until this deployment says it can transcribe and this
	browser can record: a button that opens a permission prompt and then fails
	is worse than one never offered. Tap to start, tap again to stop; the words
	go into the box with id `target` at the cursor and nothing is submitted.
-->
<script module lang="ts">
	// One recording at a time across every button on the page.
	let activeRecorder: MediaRecorder | null = null;
	let activeStream: MediaStream | null = null;
	let activeTimer: ReturnType<typeof setTimeout> | null = null;

	function stopActive() {
		if (activeTimer) {
			clearTimeout(activeTimer);
			activeTimer = null;
		}
		if (activeRecorder && activeRecorder.state !== 'inactive') activeRecorder.stop();
	}
</script>

<script lang="ts">
	import MicIcon from '@lucide/svelte/icons/mic';
	import SquareIcon from '@lucide/svelte/icons/square';
	import { Button, type ButtonVariant } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import { insert, pickType, supported, toWav, transcribe, voiceCapabilities } from './recorder.js';

	let {
		target,
		surface = '',
		showLabel = false,
		variant = 'outline',
		class: className = ''
	}: {
		/** id of the textarea the transcript is written into. */
		target: string;
		/** Spend label ("capture"); empty is dictation. */
		surface?: string;
		/** Adds the word beside the icon. */
		showLabel?: boolean;
		variant?: ButtonVariant;
		class?: string;
	} = $props();

	const i18n = useI18n();

	let offered = $state(false);
	let maxSeconds = 120;
	let maxBytes = 8 << 20;
	let mode: 'idle' | 'recording' | 'reading' = $state('idle');
	let error = $state('');
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		let live = true;
		voiceCapabilities().then((caps) => {
			if (!live) return;
			maxSeconds = caps.maxSeconds || maxSeconds;
			maxBytes = caps.maxBytes || maxBytes;
			offered = caps.available && supported();
		});
		return () => {
			live = false;
		};
	});

	function fail(message: string) {
		mode = 'idle';
		error = message;
		if (hideTimer) clearTimeout(hideTimer);
		hideTimer = setTimeout(() => (error = ''), 6000);
	}

	function box(): HTMLTextAreaElement | HTMLInputElement | null {
		return document.getElementById(target) as HTMLTextAreaElement | null;
	}

	async function send(blob: Blob) {
		if (blob.size === 0) return fail(i18n.t('dictate.empty'));
		if (blob.size > maxBytes) return fail(i18n.t('dictate.toolong'));
		const result = await transcribe(blob, surface);
		if ('text' in result) {
			mode = 'idle';
			const el = box();
			if (el) insert(el, result.text);
			return;
		}
		if (result.error === 'limit') return fail(i18n.t('dictate.limit'));
		if (result.error === 'unreachable') return fail(i18n.t('dictate.unreachable'));
		fail(result.message || i18n.t('dictate.unreadable'));
	}

	async function start() {
		error = '';
		let granted: MediaStream;
		try {
			granted = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch {
			return fail(i18n.t('dictate.mic'));
		}
		activeStream = granted;
		const type = pickType();
		const recorder = type ? new MediaRecorder(granted, { mimeType: type }) : new MediaRecorder(granted);
		activeRecorder = recorder;
		const chunks: Blob[] = [];
		recorder.addEventListener('dataavailable', (event) => {
			if (event.data && event.data.size > 0) chunks.push(event.data);
		});
		recorder.addEventListener('stop', () => {
			activeStream?.getTracks().forEach((track) => track.stop());
			activeStream = null;
			activeRecorder = null;
			mode = 'reading';
			const blob = new Blob(chunks, { type: recorder.mimeType || type || 'audio/webm' });
			toWav(blob).then(send, () => fail(i18n.t('dictate.unreadable')));
		});
		recorder.start();
		mode = 'recording';
		// The cap is enforced here rather than trusted to the person.
		activeTimer = setTimeout(stopActive, maxSeconds * 1000);
	}

	function onclick(event: MouseEvent) {
		event.preventDefault();
		if (!supported()) return fail(i18n.t('dictate.unsupported'));
		// Any button stops the recording in progress; only its own gets the words.
		if (activeRecorder && activeRecorder.state === 'recording') return stopActive();
		if (mode === 'reading') return;
		void start();
	}
</script>

{#if offered}
	<span class={cn('relative inline-flex shrink-0', className)}>
		<Button
			type="button"
			{variant}
			size={showLabel ? 'default' : 'icon'}
			class="group min-h-11 min-w-11 data-[state=recording]:border-destructive data-[state=recording]:text-destructive"
			data-dictate=""
			data-dictate-target={target}
			data-state={mode === 'idle' ? undefined : mode}
			aria-controls={target}
			aria-pressed={mode === 'recording' ? 'true' : 'false'}
			aria-busy={mode === 'reading' ? 'true' : undefined}
			aria-label={i18n.t('dictate.aria')}
			title={i18n.t('dictate.aria')}
			disabled={mode === 'reading'}
			{onclick}
		>
			<span class="inline-flex group-data-[state=reading]:hidden group-data-[state=recording]:hidden">
				<MicIcon class="size-4" />
			</span>
			<span class="hidden group-data-[state=recording]:inline-flex">
				<SquareIcon class="size-4 fill-current" />
			</span>
			<span class="hidden group-data-[state=reading]:inline-flex">
				<Spinner class="size-4" />
			</span>
			{#if showLabel}
				<span data-dictate-label
					>{mode === 'recording'
						? i18n.t('dictate.stop')
						: mode === 'reading'
							? i18n.t('dictate.reading')
							: i18n.t('dictate.say')}</span
				>
			{/if}
		</Button>
		<!-- Floats above the button so the box beside it does not jump. -->
		<span
			data-dictate-error
			role="status"
			hidden={!error}
			class="bg-popover text-destructive border-border absolute right-0 bottom-full z-20 mb-1 w-max max-w-64 rounded-md border px-2 py-1 text-xs shadow-md"
			>{error}</span
		>
	</span>
{/if}
