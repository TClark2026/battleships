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
		player_a_ready: false,
		player_b_id,
		player_b_ready: false,
		player_turn: player_a_id,
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

// function createServerSideBoard(player_id) {
// 	const cols = 12;
// 	const rows = 12;
// 	let serverSideBoard = [];

// 	for (let i = 0; i < rows; i++) {
// 		serverSideBoard[i] = [];
// 		for (let j = 0; j < cols; j++) {
// 			serverSideBoard[i][j] = 0;
// 		}
// 	}
// 	boards.set(player_id, serverSideBoard);
// }

function createServerSideShips(player_id) {
	const serverShips = [];

	for (let i = 0; i < globalShips.length; i++) {
		serverShips.push({
			...globalShips[i],
			id: crypto.randomUUID().slice(0, 6),
		});
	}

	ships.set(player_id, serverShips);
}

function placeShip(player_id, ship) {
	console.log(ship);
	const shipArr = ships.get(player_id);
	let len = 0;
	//my attempt at doing some validation so client cant input their own lengths
	for (const s of shipArr) {
		if (s.id === ship.id) {
			s.x_start = ship.x_start;
			s.y_start = ship.y_start;
			s.x_end = ship.x_end;
			s.y_end = ship.y_end;
		}
	}
}

function checkCell(session, data) {
	const attackingPlayer = session.player_turn;
	const defendingPlayer =
		attackingPlayer === session.player_a_id
			? session.player_b_id
			: session.player_a_id;

	const defendingShips = ships.get(defendingPlayer);
	for (const defendingShip of defendingShips) {
		if (
			liesOnSegment(
				data.x_coord,
				data.y_coord,
				defendingShip.x_start,
				defendingShip.y_start,
				defendingShip.x_end,
				defendingShip.y_end,
			)
		) {
			return true;
		}
	}
	return false;
}

function liesOnSegment(shot_x, shot_y, x_start, y_start, x_end, y_end) {
	if (y_start === y_end) {
		return (
			shot_y === y_start &&
			shot_x >= Math.min(x_start, x_end) &&
			shot_x <= Math.max(x_start, x_end)
		);
	}

	if (x_start === x_end) {
		return (
			shot_x === x_start &&
			shot_y >= Math.min(y_start, y_end) &&
			shot_y <= Math.max(y_start, y_end)
		);
	}

	return false;
}

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
		socket.emit("identity", socket.id);
		waitForPlayerBJoin(sessionId);
	});

	socket.on("joinSession", (data) => {
		const session = sessions.get(data);
		session.player_b_id = socket.id;
		socket.join(session.session_id);

		createServerSideShips(session.player_a_id);
		createServerSideShips(session.player_b_id);

		socket.to(session.session_id).emit("beginGame", session);
		socket.emit("beginGame", session);
		socket.emit("identity", socket.id);
	});

	socket.on("clientSetupComplete", (data) => {
		socket.emit("placeShips", ships.get(socket.id));
	});

	socket.on("shipPlaced", (data) => {
		//I know magic nums are bad, owrking on it!
		//its to make both fe and be use base 0 board
		data.x_start -= 1;
		data.y_start -= 1;
		data.x_end -= 1;
		data.y_end -= 1;
		placeShip(socket.id, data);
	});

	socket.on("allShipsPlaced", (data) => {
		console.log("all ships placed for session:", data);
		const session = sessions.get(data);
		if (socket.id === session.player_a_id) {
			session.player_a_ready = true;
		}
		if (socket.id === session.player_b_id) {
			session.player_b_ready = true;
		}
		if (session.player_a_ready && session.player_b_ready) {
			console.log("both players placed ships");
			socket.to(data).emit("beginShooting", session);
		}
	});

	socket.on("shotAt", (data) => {
		const session = sessions.get(data.session_id);
		console.log("session", session);
		console.log("socketid", socket.id);
		if (socket.id === session.player_turn) {
			data.x_coord -= 1;
			data.y_coord -= 1;
			if (checkCell(session, data)) {
				data.status = "hit";
				//messing sending to both sockets, will look at better solution
				socket.emit("hitSuccess", data);
				socket.to(data.session_id).emit("hitSuccess", data);
			} else {
				console.log("miss!");
				data.status = "miss";
				socket.emit("hitFailure", data);
				socket.to(data.session_id).emit("hitFailure", data);
			}
		}
	});

	socket.on("disconnect", () => {
		console.log("disconnected:", socket.id);
	});
});

httpServer.listen(3000, () => {
	console.log("ws server running on localhost:3000");
});
