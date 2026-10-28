import type { components } from '#lib/api/generated/schema.js';

type S = components['schemas'];

export type FeedItem = S['FeedItem'];
export type SocialOverview = S['SocialOverview'];
export type Connection = S['ConnectionView'];
export type Person = S['PersonView'];
export type Sharing = S['Sharing'];
export type PhoneView = S['PhoneView'];
export type PhoneCountries = S['PhoneCountries'];
export type FacebookFriends = S['FacebookFriends'];

/** Go: FriendsForm — the text fields carried back after a rejected submission. */
export type FriendsForm = {
	handle?: string;
	follow?: string;
	phone?: string;
	country?: string;
	errors?: Record<string, string>;
};
