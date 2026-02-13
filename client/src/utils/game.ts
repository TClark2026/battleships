import { BehaviorSubject } from "rxjs";

export type GameState = "NOT_STARTED" | "PLACE_SHIPS" | "FIRING" | "CONCLUDED";

const gameSubject = new BehaviorSubject<GameState>("NOT_STARTED");
let gameId: string | null = null;
let gameWinner: string | null = null;

export const game$ = gameSubject.asObservable();

export const gameStore = {
	setGameState(state: GameState) {
		gameSubject.next(state);
	},

	getGameState() {
		return gameSubject.value;
	},

	setGameId(id: string) {
		gameId = id;
	},

	getGameId() {
		return gameId;
	},

	setWinner(winner: string) {
		gameWinner = winner;
	},

	getWinner() {
		return gameWinner;
	},
};
