import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"],
	},
});

const sessions = new Map();
const boards = new Map();
const ships = new Map();

let allowedSessionJoinRetries = 6;

function createSessionId() {
	return crypto.randomUUID().slice(0, 8);
}

const globalShips = [
	{ length: 5, name: "Carrier", segments: [1, 1, 1, 1, 1] },
	{ length: 4, name: "Battleship", segments: [1, 1, 1, 1] },
	{ length: 3, name: "Cruiser", segments: [1, 1, 1] },
	{ length: 3, name: "Submarine", segments: [1, 1, 1] },
	{ length: 2, name: "Destroyer", segments: [1, 1] },
];

function createSession({ session_id, player_a_id, player_b_id }) {
	return {
		session_id,
		player_a_id,
		player_b_id,
		created_at: Date.now(),
	};
}

const sleep = (ms) => new Promise((num) => setTimeout(num, ms));

async function waitForPlayerBJoin(sessionId) {
	for (let retry = 0; retry < allowedSessionJoinRetries; retry++) {
		const session = sessions.get(sessionId);
		if (!session) throw new Error("Session not found");

		if (session.player_b_id != null) {
			console.log("player b joined!");
			return;
		}

		console.log("waiting for player b for session ", sessionId);
		await sleep(5000);
	}

	console.log("Session timed out");
	sessions.delete(sessionId);
	return null;
}

function createServerSideBoard(player_id) {
	const cols = 12;
	const rows = 12;
	let serverSideBoard = [];

	for (let i = 0; i < rows; i++) {
		serverSideBoard[i] = [];
		for (let j = 0; j < cols; j++) {
			serverSideBoard[i][j] = 0;
		}
	}
	boards.set(player_id, serverSideBoard);
}

function createServerSideShips(player_id) {
	let serverShips = [];
	for (let i = 0; i < globalShips.length; i++) {
		serverShips[i] = globalShips[i];
	}
	ships.set(player_id, serverShips);
}

function translateCoords(clientSideCoords) {}

io.on("connection", (socket) => {
	console.log("connected:", socket.id);

	socket.on("createSession", (data) => {
		const sessionId = createSessionId();
		const session = createSession({
			session_id: sessionId,
			player_a_id: socket.id,
			player_b_id: null,
		});
		sessions.set(sessionId, session);
		socket.emit("createdSession", sessions.get(sessionId));
		socket.join(sessionId);
		waitForPlayerBJoin(sessionId);
	});

	socket.on("joinSession", (data) => {
		const session = sessions.get(data);
		session.player_b_id = socket.id;
		socket.join(session.session_id);

		createServerSideBoard(session.player_a_id);
		createServerSideBoard(session.player_b_id);
		createServerSideShips(session.player_a_id);
		createServerSideShips(session.player_b_id);

		socket.to(session.session_id).emit("beginGame", session);
		socket.emit("beginGame", session);
	});

	socket.on("clientSetupComplete", (data) => {
		socket.emit("placeShips", ships.get(socket.id));
	});

	socket.on("disconnect", () => {
		console.log("disconnected:", socket.id);
	});
});

httpServer.listen(3000, () => {
	console.log("ws server running on localhost:3000");
});
