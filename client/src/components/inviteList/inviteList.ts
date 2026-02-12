import styles from "./inviteList.scss?inline";
export class Invite extends HTMLElement {
	private root: ShadowRoot;

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });

		this.root.innerHTML = `
    <style>${styles}</style>
    <div class="invite-list-container">
       <slot>
	   
	   </slot>
    </div>
    
    `;
	}

	connectedCallback() {}
}

customElements.define("invite-list", Invite);
