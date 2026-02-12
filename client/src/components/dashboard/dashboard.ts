import styles from "./dashboard.scss?inline";
import "../navbar/navbar";
import "../playerList/playerList";
import "../playerDiv/PlayerDiv";
import "../inviteList/inviteList";
import "../inviteDiv/inviteDiv";
import {
	listAvailablePlayers,
	playerList$,
	playerInvites$,
	type Invite,
} from "../../network/sockets";
import { Subscription } from "rxjs";
import type { User } from "../../utils/auth";

export class Dashboard extends HTMLElement {
	private root: ShadowRoot;
	private lobby: Subscription;
	private invites: Subscription;
	private localPlayers: User[] = [];
	private localInvites: Invite[] = [];

	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });

		this.root.innerHTML = `
    <style>${styles}</style>
	<player-list></player-list>
	<invite-list></invite-list>
    `;
		this.lobby = playerList$.subscribe((players) => {
			if (JSON.stringify(players) !== JSON.stringify(this.localPlayers)) {
				this.localPlayers = players;
				const playerContainer = this.root.querySelector("player-list");
				for (const player of this.localPlayers) {
					const playerElem = document.createElement("player-div") as any;
					playerElem.username = player.username;
					playerContainer?.appendChild(playerElem);
				}
			}
		});

		this.invites = playerInvites$.subscribe((invites) => {
			if (JSON.stringify(invites) !== JSON.stringify(this.localInvites)) {
				this.localInvites = invites;
				const inviteContainer = this.root.querySelector("invite-list");
				for (const invite of this.localInvites) {
					const inviteElem = document.createElement("invite-div") as any;
					inviteElem.username = invite.from;
					inviteElem.inviteId = invite.inviteId;
					inviteContainer?.appendChild(inviteElem);
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
