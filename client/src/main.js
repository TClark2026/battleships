import "./styles/main.scss";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
	transports: ["websocket"],
});

const createMatchButton = document.getElementById("create-match");
const joinMatchButton = document.getElementById("join-match");
const confirmButton = document.createElement("div");

createMatchButton.addEventListener("click", createSessionMenu);
joinMatchButton.addEventListener("click", joinSessionMenu);

function createSessionMenu() {
	// joinMatchButton.remove();
	// createMatchButton.remove();
	// spawnGameBoard();
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

const gameBoardContainer = document.createElement("div");
gameBoardContainer.classList.add("flex-container");

const friendlyBoard = document.createElement("div");
friendlyBoard.id = "friendly-board";

const enemyBoard = document.createElement("div");
enemyBoard.id = "enemy-board";

createBoard(friendlyBoard);
createBoard(enemyBoard);

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
