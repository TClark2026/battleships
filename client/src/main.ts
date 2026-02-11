import "./styles/main.scss"
import "./components/login-form/login-form";
import { sendLoginDetails, sendRegistrationDetails } from "./network/sockets";
import { auth$ } from "./utils/auth";

const loginForm = document.querySelector("login-form");

loginForm?.addEventListener("login-submit", (e) => {
  const { username, password } = (e as CustomEvent).detail;
  sendLoginDetails(username, password)
});

loginForm?.addEventListener("register-submit", (e) => {
  const { username, password } = (e as CustomEvent).detail;
  sendRegistrationDetails(username, password);
});

const sub = auth$.subscribe((state) => {
  if (state.status === "authed") {
    loginForm?.remove();
    sub.unsubscribe();
  }

});