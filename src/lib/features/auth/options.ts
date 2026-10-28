// Which optional sign-in methods the API has configured. Until north-client
// exposes them (GET /auth/options), every optional method is off.
export type AuthOptions = { google: boolean; passkey: boolean; passwordReset: boolean };

export const noAuthOptions: AuthOptions = { google: false, passkey: false, passwordReset: false };
