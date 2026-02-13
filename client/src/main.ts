import "./styles/main.scss";
import "./components/login-form/login-form";
import "./components/dashboard/dashboard";
import "./components/gameboard/gameboard";
import {
	listAvailablePlayers,
	sendLoginDetails,
	sendRegistrationDetails,
} from "./network/sockets";
import { auth$ } from "./utils/auth";
import { game$ } from "./utils/game";

let listPlayersInterval: number | null = null;
let prevGameState: string | null = null;
let gameSub: { unsubscribe(): void } | null = null;

const loginForm = document.querySelector("login-form");
const appDashboard = document.createElement("app-dashboard");
const gameBoard = document.createElement("app-gameboard");

loginForm?.addEventListener("login-submit", (e) => {
	const { username, password } = (e as CustomEvent).detail;
	sendLoginDetails(username, password);
});

loginForm?.addEventListener("register-submit", (e) => {
	const { username, password } = (e as CustomEvent).detail;
	sendRegistrationDetails(username, password);
});

auth$.subscribe((state) => {
	if (state.status !== "authed") return;

	loginForm?.remove();
	document.body.append(appDashboard);

	gameSub?.unsubscribe();
	gameSub = game$.subscribe((gameState) => {
		if (gameState === "NOT_STARTED") {
			if (!listPlayersInterval) {
				listAvailablePlayers();
				listPlayersInterval = setInterval(listAvailablePlayers, 5000);
			}
		} else {
			if (listPlayersInterval) {
				clearInterval(listPlayersInterval);
				listPlayersInterval = null;
			}
		}

		const transitioned = gameState !== prevGameState;

		if (
			transitioned &&
			prevGameState === "NOT_STARTED" &&
			gameState !== "NOT_STARTED"
		) {
			document.body.replaceChildren(gameBoard);
		}

		prevGameState = gameState;
	});
});
