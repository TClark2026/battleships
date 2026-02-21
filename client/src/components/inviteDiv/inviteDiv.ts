import { acceptInvitation, declineInvitation } from "../../network/sockets";
import styles from "./inviteDiv.scss?inline";
export class inviteDiv extends HTMLElement {
	private root: ShadowRoot;
	private _username = "";
	private _inviteId = "";

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });
		this.root.innerHTML = `
    <style>${styles}</style>
    <div class="invite-container">
      <span class="username"></span>
      <div class="btn-container">
	  <div class="accept-invite">Accept Invite</div>
      <div class="decline-invite">Decline Invite</div>
	  </div>
    </div>
  `;

		const acceptBtn = this.root.querySelector(".accept-invite");
		acceptBtn?.addEventListener("click", () => {
			acceptInvitation(this.inviteId);
		});

		const declineBtn = this.root.querySelector(".decline-invite");
		declineBtn?.addEventListener("click", () => {
			declineInvitation(this.inviteId);
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

	set inviteId(inviteId: string) {
		this._inviteId = inviteId;
	}

	get inviteId() {
		return this._inviteId;
	}

	private update() {
		const nameEl = this.root.querySelector(".username");
		if (nameEl) nameEl.textContent = this._username;
	}
}

customElements.define("invite-div", inviteDiv);
