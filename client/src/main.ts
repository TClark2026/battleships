import "./styles/main.scss";
import "./components/loginForm/loginForm";
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

const makeDashboard = () => document.createElement("app-dashboard");
const makeGameboard = () => document.createElement("app-gameboard");

let appDashboard = makeDashboard();
let gameBoard = makeGameboard();

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

        if (
            gameState !== "NOT_STARTED" &&
            (prevGameState === null || prevGameState === "NOT_STARTED")
        ) {
            gameBoard = makeGameboard();
            document.body.replaceChildren(gameBoard);
        }

        if (gameState === "CONCLUDED") {
            appDashboard = makeDashboard();
            document.body.replaceChildren(appDashboard);
            prevGameState = null;
        }

        prevGameState = gameState;
    });
});
