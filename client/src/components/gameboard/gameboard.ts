import {
	placeShips,
	shootAt,
	shotsOnEnemyBoard$,
	shotsOnMyBoard$,
} from "../../network/sockets";
import { game$, gameStore } from "../../utils/game";
import styles from "./gameboard.scss?inline";
import "toastify-js/src/toastify.css";

const COL = 13;
const ROW = 13;

const LETTERS = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
] as const;
type ColumnLetter = (typeof LETTERS)[number];

const ships = [
	{ length: 5, name: "Carrier", type: "carrier" },
	{ length: 4, name: "Battleship", type: "battleship" },
	{ length: 3, name: "Cruiser", type: "cruiser" },
	{ length: 3, name: "Submarine", type: "submarine" },
	{ length: 2, name: "Destroyer", type: "destroyer" },
] as const;

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

type ShipDef = (typeof ships)[number];

export class Gameboard extends HTMLElement {
	private root: ShadowRoot;
	private placementDir: PlacementDir = "horizontal";

	private placedBoat: ShipDef | null = null;

	private placedShipsInfo: ShipPlacement[] = [];
	private placedTypes = new Set<ShipType>();

	private selector: HTMLSelectElement | null = null;
	private resetButton: HTMLButtonElement | null = null;

	private onSelectorChange = () => {
		if (!this.selector) return;
		const selectedType = this.selector.value as ShipType;
		this.placedBoat = ships.find((s) => s.type === selectedType) ?? null;
	};

	private onResetClick = () => {
		this.resetBoard();
	};

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });

		this.root.innerHTML = `
      <style>${styles}</style>
      <div class="controls">
        <select class="selector"></select>
        <button class="reset-btn" type="button">Reset</button>
      </div>
      <div class="boards">
        <div class="board friendly-board" part="friendly-board"></div>
        <div class="board enemy-board" part="enemy-board"></div>
      </div>
    `;
	}

	connectedCallback() {
		this.selector = this.root.querySelector(".selector");
		this.resetButton = this.root.querySelector(".reset-btn");

		game$.subscribe((gameState) => {
			if (gameState === "PLACE_SHIPS") {
				this.resetBoard();
				this.rebuildSelector();
			}
		});

		const friendlyBoard =
			this.root.querySelector<HTMLDivElement>(".friendly-board");
		const enemyBoard = this.root.querySelector<HTMLDivElement>(".enemy-board");
		if (!friendlyBoard || !enemyBoard) return;

		this.createClientSideBoard(friendlyBoard, true);
		this.createClientSideBoard(enemyBoard, false);

		window.addEventListener("keydown", this.onKeyDown);
		friendlyBoard.addEventListener("click", this.onBoardClick);
		enemyBoard.addEventListener("click", this.onBoardClick);

		this.selector?.addEventListener("change", this.onSelectorChange);
		this.resetButton?.addEventListener("click", this.onResetClick);

		shotsOnEnemyBoard$.subscribe((shot) => {
			if (!shot) return;

			const enemyBoard =
				this.root.querySelector<HTMLDivElement>(".enemy-board");
			if (!enemyBoard) return;

			const coord = shot.coordinate;
			if (!coord) return;

			let x: string | undefined;
			let y: string | undefined;

			if (typeof coord === "string") {
				const m = coord.match(/^([A-L])(\d{1,2})$/);
				if (!m) return;
				x = m[1];
				y = m[2];
			} else {
				return;
			}

			const cell = enemyBoard.querySelector<HTMLElement>(
				`.cell[data-x="${x}"][data-y="${y}"]`,
			);

			if (!cell) return;

			if (shot.hit) cell.classList.add("hit");
			else cell.classList.add("miss");
		});

		shotsOnMyBoard$.subscribe((shot) => {
			if (!shot) return;

			const friendlyBoard =
				this.root.querySelector<HTMLDivElement>(".friendly-board");
			if (!friendlyBoard) return;

			const coord = shot.coordinate;
			if (!coord) return;

			let x: string | undefined;
			let y: string | undefined;

			if (typeof coord === "string") {
				const m = coord.match(/^([A-L])(\d{1,2})$/);
				if (!m) return;
				x = m[1];
				y = m[2];
			} else {
				return;
			}

			const cell = friendlyBoard.querySelector<HTMLElement>(
				`.cell[data-x="${x}"][data-y="${y}"]`,
			);

			if (!cell) return;

			if (cell.classList.contains("ship")) {
				cell.classList.add("hit");
			} else {
				cell.classList.add("miss");
			}
		});
	}

	disconnectedCallback() {
		window.removeEventListener("keydown", this.onKeyDown);

		const friendlyBoard =
			this.root.querySelector<HTMLDivElement>(".friendly-board");
		const enemyBoard = this.root.querySelector<HTMLDivElement>(".enemy-board");

		friendlyBoard?.removeEventListener("click", this.onBoardClick);
		enemyBoard?.removeEventListener("click", this.onBoardClick);

		this.selector?.removeEventListener("change", this.onSelectorChange);
		this.resetButton?.removeEventListener("click", this.onResetClick);
	}

	private resetBoard() {
		const friendlyBoard =
			this.root.querySelector<HTMLDivElement>(".friendly-board");
		if (!friendlyBoard) return;

		friendlyBoard
			.querySelectorAll<HTMLElement>(".cell.ship")
			.forEach((cell) => cell.classList.remove("ship"));

		this.placedShipsInfo = [];
		this.placedTypes.clear();
		this.placedBoat = null;

		this.rebuildSelector();
	}

	private onKeyDown = (e: KeyboardEvent) => {
		if (e.key.toLowerCase() === "r") {
			this.placementDir =
				this.placementDir === "horizontal" ? "vertical" : "horizontal";
		}
	};

	private rebuildSelector() {
		if (!this.selector) return;

		this.selector.innerHTML = "";

		const remaining = ships.filter((s) => !this.placedTypes.has(s.type));

		for (const ship of remaining) {
			const option = document.createElement("option");
			option.value = ship.type;
			option.textContent = ship.name;
			this.selector.appendChild(option);
		}

		const firstType = this.selector.options[0]?.value as ShipType | undefined;

		this.placedBoat = firstType
			? (ships.find((s) => s.type === firstType) ?? null)
			: null;
	}

	private canPlaceShip(
		board: HTMLDivElement,
		x: ColumnLetter,
		y: number,
		len: number,
		dir: PlacementDir,
	) {
		const startIndex = LETTERS.indexOf(x);
		if (startIndex === -1) return false;

		const dx = dir === "horizontal" ? 1 : 0;
		const dy = dir === "vertical" ? 1 : 0;

		for (let i = 0; i < len; i++) {
			const colIndex = startIndex + i * dx;
			const row = y + i * dy;

			if (colIndex < 0 || colIndex >= LETTERS.length) return false;
			if (row < 1 || row > 12) return false;

			const colLetter = LETTERS[colIndex];

			const targetCell = board.querySelector<HTMLElement>(
				`.cell[data-x="${colLetter}"][data-y="${row}"]`,
			);

			if (!targetCell || targetCell.classList.contains("ship")) {
				return false;
			}
		}

		return true;
	}

	private onBoardClick = (e: MouseEvent) => {
		const board = e.currentTarget as HTMLDivElement;
		const target = e.target as HTMLElement | null;
		const cell = target?.closest<HTMLElement>(".cell");
		if (!cell || cell.classList.contains("border")) return;

		const x = cell.dataset.x as ColumnLetter | undefined;
		const yStr = cell.dataset.y;
		if (!x || !yStr) return;

		const coords = { x, y: Number(yStr) };

		if (board.classList.contains("enemy-board")) {
			shootAt(String(x + yStr));
			return;
		}

		if (!this.placedBoat) return;
		if (this.placedTypes.has(this.placedBoat.type)) return;

		const len = this.placedBoat.length;

		if (!this.canPlaceShip(board, coords.x, coords.y, len, this.placementDir))
			return;

		const startIndex = LETTERS.indexOf(coords.x);
		const dx = this.placementDir === "horizontal" ? 1 : 0;
		const dy = this.placementDir === "vertical" ? 1 : 0;

		for (let i = 0; i < len; i++) {
			const colIndex = startIndex + i * dx;
			const row = coords.y + i * dy;
			const colLetter = LETTERS[colIndex];

			const targetCell = board.querySelector<HTMLElement>(
				`.cell[data-x="${colLetter}"][data-y="${row}"]`,
			);

			if (targetCell) targetCell.classList.add("ship");
		}

		this.placedShipsInfo.push({
			type: this.placedBoat.type,
			start: `${coords.x}${coords.y}`,
			orientation: this.placementDir,
		});

		this.placedTypes.add(this.placedBoat.type);

		if (this.placedShipsInfo.length >= ships.length) {
			placeShips({ ships: this.placedShipsInfo });
		}

		this.rebuildSelector();
	};

	private createClientSideBoard(board: HTMLDivElement, friendly: boolean) {
		let numCounter = 1;
		let letterCounter = 0;

		board.innerHTML = "";

		const doc = this.root.ownerDocument;

		for (let r = 0; r < ROW; r++) {
			for (let c = 0; c < COL; c++) {
				const cell = doc.createElement("div");
				cell.classList.add("cell", friendly ? "friendly" : "enemy");

				if (r !== 0 && c % 13 === 0) {
					cell.textContent = String(numCounter++);
					cell.classList.add("border");
				}

				if (c !== 0 && r % 13 === 0) {
					cell.textContent = LETTERS[letterCounter++] ?? "";
					cell.classList.add("border");
				}

				if (c === 0 && r === 0) {
					cell.classList.add("border");
				}

				if (r !== 0 && c % 13 !== 0 && c !== 0 && r % 13 !== 0) {
					cell.dataset.x = LETTERS[c - 1];
					cell.dataset.y = String(r);
				}

				board.appendChild(cell);
			}
		}
	}
}

customElements.define("app-gameboard", Gameboard);
