import styles from "./login-form.scss?inline";

export class LoginPage extends HTMLElement {
	private root: ShadowRoot;

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });

		this.root.innerHTML = `
    <style>${styles}</style>
    <div class='form-container'>
      <form>
        <p>Username</p>
        <input name="username" required />
         <p>Password</p>
        <input name="password" type="password" required />
        <div class="button-container">
        <button type="submit" value="login">Login</button>
        <button type="submit" value="register">Register</button>
        </div>
      </form>
    </div>
    `;
	}

	connectedCallback() {
		const form = this.root.querySelector("form");

		form?.addEventListener("submit", (e) => {
			e.preventDefault();

			const submitEvent = e as SubmitEvent;
			const submitter = submitEvent.submitter as HTMLButtonElement;

			const formData = new FormData(form);
			const data = {
				username: formData.get("username"),
				password: formData.get("password"),
			};

			if (submitter?.value === "login") {
				this.dispatchEvent(
					new CustomEvent("login-submit", {
						detail: data,
						bubbles: true,
						composed: true,
					}),
				);
			}

			if (submitter?.value === "register") {
				this.dispatchEvent(
					new CustomEvent("register-submit", {
						detail: data,
						bubbles: true,
						composed: true,
					}),
				);
			}
		});
	}
}

customElements.define("login-form", LoginPage);
