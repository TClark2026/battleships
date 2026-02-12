import styles from "./PlayerDiv.scss?inline";
import { invitePlayer } from "../../network/sockets";
export class PlayerDiv extends HTMLElement {
	private root: ShadowRoot;
	private _username = "";

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });
		this.root.innerHTML = `
    <style>${styles}</style>
    <div class="player-container">
      <span class="username"></span>
      <div class="send-invite">Send Invite</div>
    </div>
  `;

		const inviteBtn = this.root.querySelector(".send-invite");
		inviteBtn?.addEventListener("click", () => {
			invitePlayer(this.username);
		});
	}

	connectedCallback() {
		this.update();
	}

	set username(name: string) {
		this._username = name;
		this.update();
	}

	get username() {
		return this._username;
	}

	private update() {
		const nameEl = this.root.querySelector(".username");
		if (nameEl) nameEl.textContent = this._username;
	}
}

customElements.define("player-div", PlayerDiv);
