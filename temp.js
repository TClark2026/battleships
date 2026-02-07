const COL = 13;
const ROW = 13;

const GRID_MIN = 1;
const GRID_MAX = 12;

let placementDir = "h";
let gameOver = false;
let myTurn = true;

const ships = [
	{ length: 5, name: "Carrier" },
	{ length: 4, name: "Battleship" },
	{ length: 3, name: "Cruiser" },
	{ length: 3, name: "Submarine" },
	{ length: 2, name: "Destroyer" },
];

const toggleBtn = document.getElementById("toggle-dir");
if (toggleBtn) {
	toggleBtn.addEventListener("click", () => {
		placementDir = placementDir === "h" ? "v" : "h";
		updateDirLabel();
	});
}

const dirLabel = document.getElementById("dir-label");
function updateDirLabel() {
	if (!dirLabel) return;
	dirLabel.textContent = placementDir.toUpperCase();
}

document.addEventListener("keydown", (e) => {
	if (e.key.toLowerCase() === "r") {
		placementDir = placementDir === "h" ? "v" : "h";
		updateDirLabel();
	}
});

const friendlyBoard = document.getElementById("friendly-board");
const enemyBoard = document.getElementById("enemy-board");

initGame();

function initGame() {
	createBoard(friendlyBoard);
	createBoard(enemyBoard);
	setOptions(ships);
	startGame();
}

function startGame() {
	placeFriendlyShips();
	placeEnemyShips();
}

function shoot() {
	const enemyBoardEl = document.getElementById("enemy-board");
	const friendlyBoardEl = document.getElementById("friendly-board");

	for (const cell of enemyBoardEl.children) {
		cell.addEventListener("click", () => {
			if (gameOver) return;
			if (!myTurn) return;
			if (!cell.dataset.x || !cell.dataset.y) return;

			if (cell.classList.contains("hit") || cell.classList.contains("miss"))
				return;

			const isHit = cell.classList.contains("enemy-ship");
			cell.classList.add(isHit ? "hit" : "miss");

			if (allShipsSunk(enemyBoardEl, "enemy-ship")) {
				endGame("You Win!");
				return;
			}

			myTurn = false;

			setTimeout(() => {
				enemyShoot(friendlyBoardEl);
				if (allShipsSunk(friendlyBoardEl, "ship")) {
					endGame("You Lose!");
					return;
				}

				myTurn = true;
			}, 400);
		});
	}
}

function enemyShoot(friendlyBoardEl) {
	const candidates = [];
	for (const cell of friendlyBoardEl.children) {
		if (!cell.dataset.x || !cell.dataset.y) continue;
		if (cell.classList.contains("hit") || cell.classList.contains("miss"))
			continue;
		candidates.push(cell);
	}

	if (candidates.length === 0) return;

	const choice = candidates[Math.floor(Math.random() * candidates.length)];
	const isHit = choice.classList.contains("ship");
	choice.classList.add(isHit ? "hit" : "miss");
}

function placeEnemyShips() {
	const board = document.getElementById("enemy-board");

	for (let s = 0; s < ships.length; s++) {
		const shipLen = Number(ships[s].length);
		let placed = false;

		while (!placed) {
			const x = Math.floor(Math.random() * 12) + 1;
			const y = Math.floor(Math.random() * 12) + 1;
			const dir = Math.random() < 0.5 ? "h" : "v";

			if (canPlaceShip(board, x, y, shipLen, dir)) {
				placeShip(board, x, y, shipLen, dir, false);
				placed = true;
			}
		}
	}
}

function placeFriendlyShips() {
	const selectedShip = document.getElementById("friendly-select");
	const board = document.getElementById("friendly-board");
	const cells = board.children;

	updateDirLabel();

	for (const cell of cells) {
		cell.addEventListener("click", () => {
			if (!cell.dataset.x || !cell.dataset.y) return;
			if (!selectedShip) return;

			const shipLen = Number(selectedShip.value);
			const x = Number(cell.dataset.x);
			const y = Number(cell.dataset.y);

			if (!canPlaceShip(board, x, y, shipLen, placementDir)) {
				console.log("Can't place ship there!");
				return;
			}

			placeShip(board, x, y, shipLen, placementDir, true);

			selectedShip.remove(selectedShip.selectedIndex);
			if (selectedShip.options.length === 0) {
				selectedShip.remove();
				myTurn = true;
				shoot();
			}
		});
	}
}

function createBoard(board) {
	let numCounter = 1;
	let letterCounter = 0;
	let letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
	for (let r = 0; r < ROW; r++) {
		for (let c = 0; c < COL; c++) {
			const cell = document.createElement("div");
			cell.className = "cell";
			if (r != 0 && c % 13 == 0) {
				cell.innerHTML = numCounter++;
				cell.id = "border";
			}
			if (c != 0 && r % 13 == 0) {
				cell.innerHTML = letters[letterCounter++];
				cell.id = "border";
			}
			if (c == 0 && r == 0) {
				cell.id = "border";
			}
			if (r != 0 && c % 13 != 0 && c != 0 && r % 13 != 0) {
				cell.dataset.x = c;
				cell.dataset.y = r;
			}
			board.appendChild(cell);
		}
	}
}

function setOptions(ships) {
	const selectBox = document.getElementById("friendly-select");
	ships.forEach((ship) => {
		const opt = document.createElement("option");
		opt.value = ship.length;
		opt.innerHTML = ship.name;
		selectBox.appendChild(opt);
	});
}

function inBounds(x, y) {
	return x >= GRID_MIN && x <= GRID_MAX && y >= GRID_MIN && y <= GRID_MAX;
}

function canPlaceShip(board, x, y, len, dir = "h") {
	for (let i = 0; i < len; i++) {
		const nx = dir === "h" ? x + i : x;
		const ny = dir === "v" ? y + i : y;

		if (!inBounds(nx, ny)) return false;

		const target = board.querySelector(`[data-x="${nx}"][data-y="${ny}"]`);
		if (!target) return false;
		if (
			target.classList.contains("ship") ||
			target.classList.contains("enemy-ship")
		)
			return false;
	}
	return true;
}

function placeShip(board, x, y, len, dir = "h", friendly) {
	for (let i = 0; i < len; i++) {
		const nx = dir === "h" ? x + i : x;
		const ny = dir === "v" ? y + i : y;
		const target = board.querySelector(`[data-x="${nx}"][data-y="${ny}"]`);
		target.classList.add(friendly ? "ship" : "enemy-ship");
	}
}

function allShipsSunk(board, shipClass) {
	const shipCells = board.querySelectorAll(`.${shipClass}`);
	for (const cell of shipCells) {
		if (!cell.classList.contains("hit")) return false;
	}
	return true;
}

function endGame(message) {
	gameOver = true;
	alert(message);
}
