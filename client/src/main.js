import "./styles/main.scss";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
	transports: ["websocket"],
});

const COL = 13;
const ROW = 13;

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
	const nav = document.querySelector("nav");
	while (nav.nextSibling) {
		nav.nextSibling.remove();
	}

	console.log("msg", msg);
	const notif = document.createElement("h1");
	notif.innerText = "Joined room: " + msg.session_id;
	document.body.append(notif);

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
	createClientSideBoard(friendlyBoard, true);
	createClientSideBoard(enemyBoard, false);
	socket.emit("clientSetupComplete");
});

socket.on("placeShips", (data) => {
	console.log("data", data);
});

function createClientSideBoard(board, friendly) {
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

function placeShip(board) {
	for (let i = 0; i < board.children.length; i++) {
		board.children[i].addEventListener("click", () => {
			socket.emit("placeShip", board, {
				x_coord: board.children[i].dataset.x,
				y_coord: board.children[i].dataset.y,
			});
		});
	}
}
