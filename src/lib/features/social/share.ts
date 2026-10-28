// The X and Facebook share pages for the invite link (Go: Handler.shareLinks).
// Each channel has its own invite code, so the strangers-count can tell which
// posting brought somebody in. Plain share intents: the person posts it
// themselves; nothing is sent for them.

/** What a shared invite says before its link (Go: inviteText). */
export const inviteText =
	"I'm using Khepri to keep my goals, training and check-ins going. Join me:";

export type ShareLinks = { x: string; facebook: string };

export function shareLinks(xInviteUrl: string, facebookInviteUrl: string): ShareLinks {
	// Go's url.Values.Encode sorts keys and encodes spaces as "+".
	const x = new URLSearchParams({ text: inviteText, url: xInviteUrl });
	const fb = new URLSearchParams({ u: facebookInviteUrl });
	return {
		x: 'https://x.com/intent/post?' + x.toString(),
		facebook: 'https://www.facebook.com/sharer/sharer.php?' + fb.toString()
	};
}
