import { BehaviorSubject } from "rxjs";

export type User = {
	username: string;
	stats: { gamesPlayed: number; wins: number; losses: number };
};

export type AuthState =
	| { status: "anon"; sessionToken: null; user: null }
	| { status: "authed"; sessionToken: string; user: User };

const initialAuthState: AuthState = {
	status: "anon",
	sessionToken: null,
	user: null,
};

const authSubject = new BehaviorSubject<AuthState>(initialAuthState);

//the $ means that auth is a stream rxjs say this is a convention
export const auth$ = authSubject.asObservable();

export const authStore = {
	setAuth(payload: { sessionToken: string; user: User }) {
		authSubject.next({
			status: "authed",
			sessionToken: payload.sessionToken,
			user: payload.user,
		});
	},

	clearAuth() {
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

	getUser() {
		return authSubject.value.status === "authed"
			? authSubject.value.user
			: null;
	},
};
