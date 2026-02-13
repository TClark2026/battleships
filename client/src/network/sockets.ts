const socket = new WebSocket("ws://localhost:3000");
import { BehaviorSubject } from "rxjs";
import { auth$, authStore, type User } from "../utils/auth";
import { gameStore } from "../utils/game";
import {
	showDefeatToast,
	showErrorToast,
	showGameToast,
	showInfoToast,
	showVictoryToast,
	showWarnToast,
} from "../utils/toast";

socket.addEventListener("open", () => {
	console.log("connected");
});

export type Invite = {
	type: string;
	inviteId: string;
	from: string;
};

type PlacementDir = "horizontal" | "vertical";

type ShipType =
	| "carrier"
	| "battleship"
	| "cruiser"
	| "submarine"
	| "destroyer";

type ShipPlacement = {
	type: ShipType;
	start: string;
	orientation: PlacementDir;
};

type ShipsPayload = {
	ships: ShipPlacement[];
};

type Shot = {
	coordinate: string;
	hit: boolean;
	sunk: string | null;
} | null;

const playerSubject = new BehaviorSubject<User[]>([]);
export const playerList$ = playerSubject.asObservable();

const inviteSubject = new BehaviorSubject<Invite[]>([]);
export const playerInvites$ = inviteSubject.asObservable();

const shotsOnMyBoardSubject = new BehaviorSubject<Shot>(null);
export const shotsOnMyBoard$ = shotsOnMyBoardSubject.asObservable();

const shotsOnEnemyBoardSubject = new BehaviorSubject<Shot>(null);
export const shotsOnEnemyBoard$ = shotsOnEnemyBoardSubject.asObservable();

function clearAllObservables() {
	playerSubject.next([]);
	inviteSubject.next([]);
	shotsOnMyBoardSubject.next(null);
	shotsOnEnemyBoardSubject.next(null);
}

export function addInvite(invite: Invite): void {
	const current = inviteSubject.getValue();
	inviteSubject.next([...current, invite]);
}
export function removeInvite(inviteId: string): void {
	const current = inviteSubject.getValue();
	inviteSubject.next(current.filter((invite) => invite.inviteId !== inviteId));
}

socket.addEventListener("message", (event) => {
	const msg = JSON.parse(String(event.data));
	console.log("msg", msg);
	if (
		msg.type === "error" ||
		msg.type === "game_error" ||
		msg.type === "auth_error"
	) {
		const message = msg.message + "!";
		showErrorToast(message ?? "An unexpected error occurred.");
		return;
	}

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

	if (msg.type === "invite_accepted") {
		gameStore.setGameId(msg.gameId);
		gameStore.setGameState("PLACE_SHIPS");
	}

	if (msg.type === "invite_declined") {
		showWarnToast(`Your invite with ID ${msg.inviteId} was declined`);
		removeInvite(msg.inviteId);
	}

	if (msg.type === "game_start") {
		gameStore.setGameState("FIRING");
		showInfoToast("GAME START!");
		if (msg.yourTurn) {
			showInfoToast("It's your turn!");
		}
	}

	if (msg.type === "ships_accepted") {
		showInfoToast("Successfully Placed ships!");
	}

	if (msg.type === "waiting_for_opponent") {
		showWarnToast("Waiting For Opponent!");
	}

	if (msg.type === "shot_result") {
		shotsOnEnemyBoardSubject.next({
			coordinate: msg.coordinate,
			hit: msg.hit,
			sunk: msg.sunk,
		});
		if (msg.hit) {
			showGameToast("Hit! " + msg.coordinate);
		} else {
			showGameToast("Missed! " + msg.coordinate);
		}
	}

	if (msg.type === "shot_fired") {
		shotsOnMyBoardSubject.next({
			coordinate: msg.coordinate,
			hit: msg.hit,
			sunk: msg.sunk,
		});
	}

	if (msg.type === "game_over") {
		gameStore.setGameState("CONCLUDED");
		if (msg.winner === authStore.getUser()?.username) {
			showVictoryToast(
				`Congratulations ${msg.winner}, you won! \n Reason: ${msg.reason}`,
			);
		} else {
			showDefeatToast(
				`Unlucky ${authStore.getUser()?.username}, \n ${msg.winner} defeated you! \n 
				Reason: ${msg.reason}`,
			);
		}
		clearAllObservables();
		gameStore.setGameState("NOT_STARTED");
	}

	if (msg.type === "turn_change") {
		if (msg.currentTurn === authStore.getUser()?.username) {
			showInfoToast("It's your turn!");
		}
	}
	//{ "type": "ship_sunk", "shipType": "destroyer", "player": "player2" }
	if (msg.type === "ship_sunk") {
		if (msg.player === authStore.getUser()?.username) {
			showGameToast(`Your ${msg.shipType} was sunk`);
		} else {
			showGameToast(`${msg.player}'s ${msg.shipType} was sunk`);
		}
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

export function forfeitGame() {
	sendAuthed("forfeit");
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

export function placeShips(ships: ShipsPayload) {
	sendAuthed("place_ships", ships);
}

export function shootAt(coordinate: string) {
	sendAuthed("shoot", { coordinate: coordinate });
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
