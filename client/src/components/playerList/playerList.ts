import styles from "./playerList.scss?inline";
export class Player extends HTMLElement {
	private root: ShadowRoot;

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });

		this.root.innerHTML = `
    <style>${styles}</style>
	<div class="player-list-container">
	 <h2>Online Players</h2>
       <slot>
	    <p>No available players</p>
	   </slot>
    </div>
    
    `;
	}

	connectedCallback() {}
}

customElements.define("player-list", Player);
