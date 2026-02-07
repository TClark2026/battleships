import "./styles/main.scss";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
	transports: ["websocket"],
});

const COL = 13;
const ROW = 13;
const GRID_MIN = 1;
const GRID_MAX = 12;

let placementDir = "h";

const ships = [
	{ length: 5, name: "Carrier" },
	{ length: 4, name: "Battleship" },
	{ length: 3, name: "Cruiser" },
	{ length: 3, name: "Submarine" },
	{ length: 2, name: "Destroyer" },
];

document.addEventListener("keydown", (e) => {
	if (e.key.toLowerCase() === "r") {
		placementDir = placementDir === "h" ? "v" : "h";
	}
});

const createMatchButton = document.getElementById("create-match");
const joinMatchButton = document.getElementById("join-match");
const confirmButton = document.createElement("div");

createMatchButton.addEventListener("click", createSessionMenu);
joinMatchButton.addEventListener("click", joinSessionMenu);

function createSessionMenu() {
	socket.emit("createSession");
}

function joinSessionMenu() {
	joinMatchButton.remove();
	createMatchButton.remove();
	const joinDiv = document.createElement("div");
	joinDiv.classList.add("flex-container", "join-text-input");

	joinDiv.textContent = "Enter Join Code";

	const input = document.createElement("input");
	joinDiv.appendChild(input);

	confirmButton.classList.add("select-button");
	confirmButton.textContent = "Join";

	joinDiv.appendChild(confirmButton);

	document.body.appendChild(joinDiv);

	confirmButton.addEventListener("click", () => {
		socket.emit("joinSession", input.value);
	});
}

socket.on("createdSession", (msg) => {
	console.log("createdSession:", msg);
	const sessionId = document.createElement("h1");
	sessionId.innerText = msg.session_id;
	document.body.appendChild(sessionId);
});

socket.on("beginGame", (msg) => {
	//maybe there is a better way to do this, but for now this removes everything below navbar
	const nav = document.querySelector("nav");
	while (nav.nextSibling) {
		nav.nextSibling.remove();
	}

	console.log("msg", msg);
	const notif = document.createElement("h1");
	notif.innerText = "Joined room!";
});

const selector = document.createElement("select");
selector.id = "friendly-select";
document.body.append(selector);

const gameBoardContainer = document.createElement("div");
gameBoardContainer.classList.add("flex-container");
document.body.appendChild(gameBoardContainer);

const friendlyBoard = document.createElement("div");
friendlyBoard.classList.add("board");
friendlyBoard.id = "friendly-board";
gameBoardContainer.appendChild(friendlyBoard);

const enemyBoard = document.createElement("div");
enemyBoard.classList.add("board");
enemyBoard.id = "enemy-board";
gameBoardContainer.appendChild(enemyBoard);

createBoard(friendlyBoard, true);
createBoard(enemyBoard, false);
setOptions(ships);
placeShips();

function createBoard(board, friendly) {
	let numCounter = 1;
	let letterCounter = 0;
	let letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
	for (let r = 0; r < ROW; r++) {
		for (let c = 0; c < COL; c++) {
			const cell = document.createElement("div");
			cell.classList.add("cell");
			friendly ? cell.classList.add("friendly") : cell.classList.add("enemy");

			if (r != 0 && c % 13 == 0) {
				cell.innerHTML = numCounter++;
				cell.classList.add("border");
			}
			if (c != 0 && r % 13 == 0) {
				cell.innerHTML = letters[letterCounter++];
				cell.classList.add("border");
			}
			if (c == 0 && r == 0) {
				cell.classList.add("border");
			}
			if (r != 0 && c % 13 != 0 && c != 0 && r % 13 != 0) {
				cell.dataset.x = c;
				cell.dataset.y = r;
			}
			board.appendChild(cell);
		}
	}
}

function placeShips() {
	const selectedShip = document.getElementById("friendly-select");
	const board = document.getElementById("friendly-board");
	const cells = board.children;

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
			}
		});
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
