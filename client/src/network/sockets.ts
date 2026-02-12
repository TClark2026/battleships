const socket = new WebSocket("ws://localhost:3000");
import { BehaviorSubject } from "rxjs";
import { authStore, type User } from "../utils/auth";

socket.addEventListener("open", () => {
	console.log("connected");
});

export type Invite = {
	type: string;
	inviteId: string;
	from: string;
};

const playerSubject = new BehaviorSubject<User[]>([]);
export const playerList$ = playerSubject.asObservable();

const inviteSubject = new BehaviorSubject<Invite[]>([]);
export const playerInvites$ = inviteSubject.asObservable();

export function addInvite(invite: Invite): void {
	const current = inviteSubject.getValue();
	inviteSubject.next([...current, invite]);
}

socket.addEventListener("message", (event) => {
	const msg = JSON.parse(String(event.data));
	console.log("msg", msg);
	if (msg.type === "auth_success") {
		authStore.setAuth({
			sessionToken: msg.sessionToken,
			user: msg.user,
		});
		return;
	}

	if (msg.type === "auth_required") {
		authStore.clearAuth();
		return;
	}

	if (msg.type === "player_list") {
		playerSubject.next(msg.players as User[]);
		return;
	}

	if (msg.type === "invite_received") {
		addInvite(msg as Invite);
		return;
	}
});

socket.addEventListener("close", (event) => {
	console.log("closed", {
		code: event.code,
		reason: event.reason,
		clean: event.wasClean,
	});
});

socket.addEventListener("error", () => {
	console.log("socket error");
});

export function sendRegistrationDetails(username: string, password: string) {
	const data = { type: "register", username: username, password: password };

	socket.send(JSON.stringify(data));
}

export function sendLoginDetails(username: string, password: string) {
	const data = { type: "login", username: username, password: password };

	socket.send(JSON.stringify(data));
}

export function listAvailablePlayers() {
	sendAuthed("list_players");
}

export function invitePlayer(username: string) {
	// const token = authStore.getToken();
	// if (!token) throw new Error("Not authenticated");
	// const data = {
	// 	type: "send_invite",
	// 	sessionToken: token,
	// 	targetUsername: username,
	// };
	// socket.send(JSON.stringify(data));

	sendAuthed("send_invite", { targetUsername: username });
}

export function acceptInvitation(inviteId: string) {
	sendAuthed("accept_invite", { inviteId: inviteId });
}

export function declineInvitation(inviteId: string) {
	sendAuthed("decline_invite", { inviteId: inviteId });
}

function sendAuthed(type: string, payload?: Record<string, unknown>) {
	const token = authStore.getToken();
	if (!token) throw new Error("Not authenticated");

	socket.send(
		JSON.stringify({
			type,
			sessionToken: token,
			...(payload || {}),
		}),
	);
}
