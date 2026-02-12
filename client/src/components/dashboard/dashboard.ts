import styles from "./dashboard.scss?inline";
import "../navbar/navbar";
import { listAvailablePlayers, playerList$ } from "../../network/sockets";
import { Subscription } from "rxjs";
import type { User } from "../../utils/auth";

export class Dashboard extends HTMLElement {
	private root: ShadowRoot;
	private sub: Subscription;
	private localPlayers: User[] = [];

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });

		this.root.innerHTML = `
    <style>${styles}</style>
	<div class="flex-container"></div>
    `;
		this.sub = playerList$.subscribe((players) => {
			if (JSON.stringify(players) !== JSON.stringify(this.localPlayers)) {
				this.localPlayers = players;
				const playerContainer = this.root.querySelector(".flex-container");
				for (const player of this.localPlayers) {
					const playerDiv = document.createElement("div");
					playerDiv.innerText = player.username;
					playerContainer?.appendChild(playerDiv);
				}
			}
		});
	}

	connectedCallback() {
		setInterval(() => {
			listAvailablePlayers();
		}, 5000);
	}
}

customElements.define("app-dashboard", Dashboard);
