import "./styles/main.scss";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
	transports: ["websocket"],
});

socket.on("createdSession", (msg) => {
	console.log("createdSession:", msg);
	const sessionId = document.createElement("h1");
	sessionId.innerText = msg.session_id;
	document.body.appendChild(sessionId);
});

const createMatchButton = document.getElementById("create-match");
const joinMatchButton = document.getElementById("join-match");

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

	const confirmButton = document.createElement("div");
	confirmButton.classList.add("select-button");
	confirmButton.textContent = "Join";

	joinDiv.appendChild(confirmButton);

	document.body.appendChild(joinDiv);

	confirmButton.addEventListener("click", () => {
		socket.emit("joinSession", input.value);
	});
}
