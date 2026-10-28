// Class strings shared by the chat components (web/chat/chat.templ consts).

/** Rendered markdown, without a type size. */
export const proseBody =
	'[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ' +
	'[&_p]:my-2 [&_p]:leading-relaxed ' +
	'[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 ' +
	'[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 ' +
	'[&_strong]:font-semibold ' +
	'[&_h1]:mt-3 [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-semibold ' +
	'[&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold ' +
	'[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold ' +
	'[&_code]:bg-background/60 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs ' +
	'[&_pre]:bg-background/60 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-3 ' +
	'[&_pre_code]:bg-transparent [&_pre_code]:p-0 ' +
	'[&_a]:underline [&_a]:underline-offset-2 ' +
	'[&_blockquote]:border-l-2 [&_blockquote]:border-current/20 [&_blockquote]:pl-3 [&_blockquote]:italic ' +
	'[&_table]:my-2 [&_table]:w-full [&_table]:text-left ' +
	'[&_th]:border-b [&_th]:border-current/20 [&_th]:pb-1 [&_th]:font-medium ' +
	'[&_td]:py-1';

export const proseClasses = 'text-sm ' + proseBody;

// The Muse bubbles: radius 24, no avatar, no per-message name.
export const museUserBubble =
	'bg-muse-user text-muse-user-text max-w-[85%] rounded-[24px] px-4 py-2.5 text-[15px] leading-normal whitespace-pre-wrap';
export const museAgentBubble =
	'bg-muse-agent text-foreground border-hairline max-w-[94%] rounded-[24px] border px-4 py-3 text-[15px] leading-normal dark:border-transparent';

/** The 11px uppercase caption above a proactive bubble or a standing task. */
export const museCaption = 'text-muted-foreground text-[11px] font-medium tracking-wider uppercase';
