const socket = new WebSocket("ws://localhost:3000");
import { authStore } from "../utils/auth";

socket.addEventListener("open", () => {
  console.log("connected");
});

socket.addEventListener("message", (event) => {
  const msg = JSON.parse(String(event.data));
  console.log('msg', msg)
    if (msg.type === "auth_success") {
      authStore.setAuth({
        sessionToken: msg.sessionToken,
        user: msg.user,
      });
      return;
    }

    if (msg.type === "auth_required") {
      authStore.clearAuth();
      return;
    }

});

socket.addEventListener("close", (event) => {
  console.log("closed", { code: event.code, reason: event.reason, clean: event.wasClean });
});

socket.addEventListener("error", () => {
  console.log("socket error");
});


export function sendRegistrationDetails  (username : string, password: string) {
    const data = { "type": "register", "username": username, "password": password };
    
    socket.send(JSON.stringify(data));
}

export function sendLoginDetails  (username : string, password: string) {
    const data = { "type": "login", "username": username, "password": password };
    
    socket.send(JSON.stringify(data));
}


function sendAuthed(type: string, data: unknown) {
  const token = authStore.getToken();
  if (!token) throw new Error("Not authenticated");

  socket.send(JSON.stringify({ type, sessionToken: token, data }));
}