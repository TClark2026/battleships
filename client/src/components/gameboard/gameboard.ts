import {
    forfeitGame,
    placeShips,
    shootAt,
    shotsOnEnemyBoard$,
    shotsOnMyBoard$,
    reconnectGameState$,
    type ShipType,
} from "../../network/sockets";
import { Subscription, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import styles from "./gameboard.scss?inline";
import "toastify-js/src/toastify.css";
import { game$, type GameState } from "../../utils/game";

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

type ShipPlacement = {
    type: ShipType;
    start: string;
    orientation: PlacementDir;
};

type ShipDef = (typeof ships)[number];

type ReconnectGameState = {
    type: "reconnect_game_state";
    gameId: string;
    ships: { type: ShipType; tiles: string[]; hits: string[] }[];
    shots: { coordinate: string; hit: boolean; sunk: ShipType | null }[];
};

export class Gameboard extends HTMLElement {
    private previewCells: HTMLElement[] = [];
    private onBoardMove = (e: MouseEvent) => this.handleBoardHover(e);
    private onBoardLeave = () => this.clearPreview();
    private inShipsPhase = false;
    private hasRestoredBoard = false;
    private currentGameState: GameState = "NOT_STARTED";

    private root: ShadowRoot;
    private placementDir: PlacementDir = "horizontal";

    private placedBoat: ShipDef | null = null;

    private placedShipsInfo: ShipPlacement[] = [];
    private placedTypes = new Set<ShipType>();

    private selector: HTMLSelectElement | null = null;
    private resetButton: HTMLButtonElement | null = null;
    private forfeitButton: HTMLButtonElement | null = null;

    private destroy$ = new Subject<void>();
    private subscriptions = new Subscription();
    private allShipsPlaced = false;

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
	  <div class="col-container">
	  <select class="selector"></select>
		<button class="rotate-btn" type="button">Rotate Ship</button>
		</div>
       <div>
	  <button class="reset-btn" type="button">Reset</button>
		<button class="forfeit-btn" type="button">Forfeit</button>  
	   </div>
      </div>
	   <p>Press (R) to rotate ships.</p>
      <div class="boards">
        <div class="board friendly-board" part="friendly-board"></div>
        <div class="board enemy-board" part="enemy-board"></div>
      </div>
    `;
    }

    connectedCallback() {
        this.selector = this.root.querySelector(".selector");
        this.resetButton = this.root.querySelector(".reset-btn");
        this.forfeitButton = this.root.querySelector(".forfeit-btn");
        this.root
            .querySelector(".rotate-btn")
            ?.addEventListener("click", () => {
                if (this.placementDir === "horizontal") {
                    this.placementDir = "vertical";
                } else {
                    this.placementDir = "horizontal";
                }
                console.log("this.placementDir", this.placementDir);
            });

        const friendlyBoard =
            this.root.querySelector<HTMLDivElement>(".friendly-board");
        const enemyBoard =
            this.root.querySelector<HTMLDivElement>(".enemy-board");
        if (!friendlyBoard || !enemyBoard) return;

        this.createClientSideBoard(friendlyBoard, true);
        this.createClientSideBoard(enemyBoard, false);

        window.addEventListener("keydown", this.onKeyDown);
        friendlyBoard.addEventListener("click", this.onBoardClick);
        friendlyBoard.addEventListener("mousemove", this.onBoardMove);
        friendlyBoard.addEventListener("mouseleave", this.onBoardLeave);

        enemyBoard.addEventListener("click", this.onBoardClick);

        this.selector?.addEventListener("change", this.onSelectorChange);
        this.resetButton?.addEventListener("click", this.onResetClick);
        this.forfeitButton?.addEventListener("click", () => {
            console.log("clicked");
            forfeitGame();
        });

        this.subscriptions.add(
            reconnectGameState$
                .pipe(takeUntil(this.destroy$))
                .subscribe((state) => {
                    if (!state) return;
                    this.applyReconnectState(state);
                }),
        );

        this.subscriptions.add(
            game$.pipe(takeUntil(this.destroy$)).subscribe((gameState) => {
                this.currentGameState = gameState;

                if (gameState === "PLACE_SHIPS") {
                    if (!this.hasRestoredBoard) this.resetBoard();
                    this.rebuildSelector();
                    this.inShipsPhase = true;
                } else {
                    this.inShipsPhase = false;
                }
            }),
        );

        this.subscriptions.add(
            shotsOnEnemyBoard$
                .pipe(takeUntil(this.destroy$))
                .subscribe((shot) => {
                    if (!shot) return;
                    const enemyBoard =
                        this.root.querySelector<HTMLDivElement>(".enemy-board");
                    if (!enemyBoard) return;

                    const coord = shot.coordinate;
                    if (!coord || typeof coord !== "string") return;

                    const m = coord.match(/^([A-L])(\d{1,2})$/);
                    if (!m) return;

                    const [, x, y] = m;

                    const cell = enemyBoard.querySelector<HTMLElement>(
                        `.cell[data-x="${x}"][data-y="${y}"]`,
                    );

                    if (!cell) return;
                    cell.classList.add(shot.hit ? "hit" : "miss");
                }),
        );

        this.subscriptions.add(
            shotsOnMyBoard$.pipe(takeUntil(this.destroy$)).subscribe((shot) => {
                if (!shot) return;
                const friendlyBoard =
                    this.root.querySelector<HTMLDivElement>(".friendly-board");
                if (!friendlyBoard) return;

                const coord = shot.coordinate;
                if (!coord || typeof coord !== "string") return;

                const m = coord.match(/^([A-L])(\d{1,2})$/);
                if (!m) return;

                const [, x, y] = m;

                const cell = friendlyBoard.querySelector<HTMLElement>(
                    `.cell[data-x="${x}"][data-y="${y}"]`,
                );

                if (!cell) return;

                if (cell.classList.contains("ship")) {
                    cell.classList.add("hit");
                } else {
                    cell.classList.add("miss");
                }
            }),
        );
    }

    disconnectedCallback() {
        window.removeEventListener("keydown", this.onKeyDown);

        const friendlyBoard =
            this.root.querySelector<HTMLDivElement>(".friendly-board");
        const enemyBoard =
            this.root.querySelector<HTMLDivElement>(".enemy-board");

        friendlyBoard?.removeEventListener("click", this.onBoardClick);
        friendlyBoard?.removeEventListener("mousemove", this.onBoardMove);
        friendlyBoard?.removeEventListener("mouseleave", this.onBoardLeave);

        enemyBoard?.removeEventListener("click", this.onBoardClick);

        this.selector?.removeEventListener("change", this.onSelectorChange);
        this.resetButton?.removeEventListener("click", this.onResetClick);

        this.destroy$.next();
        this.destroy$.complete();

        this.subscriptions.unsubscribe();
    }

    private resetBoard() {
        const friendlyBoard =
            this.root.querySelector<HTMLDivElement>(".friendly-board");
        if (!friendlyBoard) return;

        friendlyBoard
            .querySelectorAll<HTMLElement>(".cell.ship, .cell.hit, .cell.miss")
            .forEach((cell) => cell.classList.remove("ship", "hit", "miss"));

        this.hasRestoredBoard = false;

        this.placedShipsInfo = [];
        this.placedTypes.clear();
        this.placedBoat = null;
        this.clearPreview();
        this.allShipsPlaced = false;
        this.updateControlsVisibility();
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

        const firstType = this.selector.options[0]?.value as
            | ShipType
            | undefined;

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
                console.log("invalid");
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

        if (board.classList.contains("enemy-board")) {
            if (this.currentGameState !== "FIRING") return;
            shootAt(String(x + yStr));
            return;
        }

        if (this.currentGameState !== "PLACE_SHIPS") return;

        if (!this.placedBoat) return;
        if (this.placedTypes.has(this.placedBoat.type)) return;

        const len = this.placedBoat.length;

        if (!this.canPlaceShip(board, x, Number(yStr), len, this.placementDir))
            return;

        const startIndex = LETTERS.indexOf(x);
        const dx = this.placementDir === "horizontal" ? 1 : 0;
        const dy = this.placementDir === "vertical" ? 1 : 0;

        for (let i = 0; i < len; i++) {
            const colIndex = startIndex + i * dx;
            const row = Number(yStr) + i * dy;
            const colLetter = LETTERS[colIndex];

            const targetCell = board.querySelector<HTMLElement>(
                `.cell[data-x="${colLetter}"][data-y="${row}"]`,
            );

            if (targetCell) {
                this.clearPreview();
                targetCell.classList.add("ship");
            }
        }

        this.placedShipsInfo.push({
            type: this.placedBoat.type,
            start: `${x}${Number(yStr)}`,
            orientation: this.placementDir,
        });

        this.placedTypes.add(this.placedBoat.type);

        if (this.placedShipsInfo.length >= ships.length) {
            placeShips({ ships: this.placedShipsInfo });

            this.allShipsPlaced = true;
            this.updateControlsVisibility();

            return;
        }

        this.rebuildSelector();
    };

    private clearPreview() {
        for (const cell of this.previewCells) {
            cell.classList.remove("ship-preview", "invalid");
        }
        this.previewCells = [];
    }

    private getPlacementCells(
        board: HTMLDivElement,
        x: ColumnLetter,
        y: number,
        len: number,
        dir: PlacementDir,
    ) {
        const startIndex = LETTERS.indexOf(x);
        if (startIndex === -1) return null;

        const dx = dir === "horizontal" ? 1 : 0;
        const dy = dir === "vertical" ? 1 : 0;

        const cells: HTMLElement[] = [];

        for (let i = 0; i < len; i++) {
            const colIndex = startIndex + i * dx;
            const row = y + i * dy;

            if (colIndex < 0 || colIndex >= LETTERS.length) return null;
            if (row < 1 || row > 12) return null;

            const colLetter = LETTERS[colIndex];
            const targetCell = board.querySelector<HTMLElement>(
                `.cell[data-x="${colLetter}"][data-y="${row}"]`,
            );

            if (!targetCell) return null;
            cells.push(targetCell);
        }

        return cells;
    }

    private handleBoardHover(e: MouseEvent) {
        const board = e.currentTarget as HTMLDivElement;
        if (!board.classList.contains("friendly-board")) return;

        if (!this.inShipsPhase) return;

        const target = e.target as HTMLElement | null;
        const cell = target?.closest<HTMLElement>(".cell");
        if (!cell || cell.classList.contains("border")) {
            this.clearPreview();
            return;
        }

        if (!this.placedBoat) {
            this.clearPreview();
            return;
        }

        if (this.placedTypes.has(this.placedBoat.type)) {
            this.clearPreview();
            return;
        }

        const x = cell.dataset.x as ColumnLetter | undefined;
        const yStr = cell.dataset.y;
        if (!x || !yStr) {
            this.clearPreview();
            return;
        }

        const y = Number(yStr);
        const len = this.placedBoat.length;

        const cells = this.getPlacementCells(
            board,
            x,
            y,
            len,
            this.placementDir,
        );
        this.clearPreview();
        if (!cells) return;

        const valid = this.canPlaceShip(board, x, y, len, this.placementDir);

        for (const c of cells) {
            c.classList.add("ship-preview");
            if (!valid) c.classList.add("invalid");
        }

        this.previewCells = cells;
    }

    private applyReconnectState(state: ReconnectGameState) {
        const friendlyBoard =
            this.root.querySelector<HTMLDivElement>(".friendly-board");
        const enemyBoard =
            this.root.querySelector<HTMLDivElement>(".enemy-board");
        if (!friendlyBoard || !enemyBoard) return;

        friendlyBoard
            .querySelectorAll<HTMLElement>(".cell.ship, .cell.hit, .cell.miss")
            .forEach((cell) => cell.classList.remove("ship", "hit", "miss"));
        enemyBoard
            .querySelectorAll<HTMLElement>(".cell.hit, .cell.miss")
            .forEach((cell) => cell.classList.remove("hit", "miss"));

        this.placedShipsInfo = [];
        this.placedTypes.clear();
        this.placedBoat = null;
        this.clearPreview();

        for (const ship of state.ships ?? []) {
            this.placedTypes.add(ship.type);
            for (const tile of ship.tiles ?? []) {
                const m = tile.match(/^([A-L])(\d{1,2})$/);
                if (!m) continue;
                const [, x, y] = m;

                const cell = friendlyBoard.querySelector<HTMLElement>(
                    `.cell[data-x="${x}"][data-y="${y}"]`,
                );
                cell?.classList.add("ship");
            }
            for (const hitTile of ship.hits ?? []) {
                const m = hitTile.match(/^([A-L])(\d{1,2})$/);
                if (!m) continue;
                const [, x, y] = m;
                const cell = friendlyBoard.querySelector<HTMLElement>(
                    `.cell[data-x="${x}"][data-y="${y}"]`,
                );
                cell?.classList.add("hit");
            }
        }

        for (const shot of state.shots ?? []) {
            const coord = shot.coordinate;
            const m = coord?.match(/^([A-L])(\d{1,2})$/);
            if (!m) continue;
            const [, x, y] = m;

            const cell = enemyBoard.querySelector<HTMLElement>(
                `.cell[data-x="${x}"][data-y="${y}"]`,
            );
            if (!cell) continue;
            cell.classList.add(shot.hit ? "hit" : "miss");
        }

        this.hasRestoredBoard = true;

        this.allShipsPlaced = this.placedTypes.size >= ships.length;
        this.updateControlsVisibility();

        if (!this.allShipsPlaced) this.rebuildSelector();
    }

    private updateControlsVisibility() {
        const controls = this.root.querySelector<HTMLElement>(".controls");
        if (!controls) return;

        controls.classList.toggle("placement-done", this.allShipsPlaced);
    }

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
