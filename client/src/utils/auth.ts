import { BehaviorSubject } from "rxjs";

export type User = {
	username: string;
	stats: { gamesPlayed: number; wins: number; losses: number };
};

export type AuthState =
	| { status: "anon"; sessionToken: null; user: null }
	| { status: "authed"; sessionToken: string; user: User };

const SESSION_TOKEN_KEY = "sessionToken";

const initialAuthState: AuthState = {
	status: "anon",
	sessionToken: null,
	user: null,
};

const authSubject = new BehaviorSubject<AuthState>(initialAuthState);

export const auth$ = authSubject.asObservable();

function storeToken(token: string) {
	localStorage.setItem(SESSION_TOKEN_KEY, token);
}

function clearStoredToken() {
	localStorage.removeItem(SESSION_TOKEN_KEY);
}

export const authStore = {
	setAuth(payload: { sessionToken: string; user: User }) {
		storeToken(payload.sessionToken);

		authSubject.next({
			status: "authed",
			sessionToken: payload.sessionToken,
			user: payload.user,
		});
	},

	clearAuth() {
		clearStoredToken();

		authSubject.next({
			status: "anon",
			sessionToken: null,
			user: null,
		});
	},

	isAuthed() {
		return authSubject.value.status === "authed";
	},

	getToken() {
		return authSubject.value.status === "authed"
			? authSubject.value.sessionToken
			: null;
	},

	getStoredToken(): string | null {
		return localStorage.getItem(SESSION_TOKEN_KEY);
	},

	getUser() {
		return authSubject.value.status === "authed"
			? authSubject.value.user
			: null;
	},
};
