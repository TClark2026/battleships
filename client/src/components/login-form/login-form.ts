import styles from "./login-form.scss?inline";

export class LoginPage extends HTMLElement {
  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });

    this.root.innerHTML = `
      <style>${styles}</style>
      <div class="form-container">
        <form novalidate>
          <p><label for="username">Username</label></p>
          <input id="username" name="username" autocomplete="username" required />

          <p><label for="password">Password</label></p>
          <input id="password" name="password" type="password" autocomplete="current-password" required />

          <p class="error" id="form-error" aria-live="polite"></p>

          <div class="button-container">
            <button type="submit" value="login">Login</button>
            <button type="submit" value="register">Register</button>
          </div>
        </form>
      </div>
    `;
  }

  connectedCallback() {
    const form = this.root.querySelector("form") as HTMLFormElement | null;
    const username = this.root.querySelector(
      "#username",
    ) as HTMLInputElement | null;
    const password = this.root.querySelector(
      "#password",
    ) as HTMLInputElement | null;
    const error = this.root.querySelector("#form-error") as HTMLElement | null;

    username?.focus();

    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const submitEvent = e as SubmitEvent;
      const submitter = submitEvent.submitter as HTMLButtonElement | null;

      const data = {
        username: (username?.value ?? "").trim(),
        password: password?.value ?? "",
      };

      if (!data.username || !data.password) {
        if (error) error.textContent = "Username and password are required.";
        if (!data.username) username?.focus();
        else password?.focus();
        return;
      }

      if (error) error.textContent = "";

      const action = submitter?.value ?? "login";

      this.dispatchEvent(
        new CustomEvent(
          action === "register" ? "register-submit" : "login-submit",
          {
            detail: data,
            bubbles: true,
            composed: true,
          },
        ),
      );
    });
  }
}

customElements.define("login-form", LoginPage);
