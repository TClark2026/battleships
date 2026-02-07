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
let allowedSessionJoinRetries = 6;

function createSessionId() {
	return crypto.randomUUID().slice(0, 8);
}

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
		socket.to(session.session_id).emit("beginGame", session);
		socket.emit("beginGame", session);
	});

	socket.on("disconnect", () => {
		console.log("disconnected:", socket.id);
	});
});

httpServer.listen(3000, () => {
	console.log("ws server running on localhost:3000");
});
