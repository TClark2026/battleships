import styles from "./inviteList.scss?inline";
export class Invite extends HTMLElement {
	private root: ShadowRoot;

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });

		this.root.innerHTML = `
    <style>${styles}</style>
    <div class="invite-list-container">
	<h2>Pending Invites</h2>
       <slot>
		<p>No Invites Received</p>
	   </slot>
    </div>
    
    `;
	}

	connectedCallback() {}
}

customElements.define("invite-list", Invite);
