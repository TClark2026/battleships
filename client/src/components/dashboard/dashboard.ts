import styles from "./dashboard.scss?inline";
import "../navbar/navbar";
import "../playerList/playerList";
import "../playerDiv/PlayerDiv";
import "../inviteList/inviteList";
import "../inviteDiv/inviteDiv";
import {
	playerList$,
	playerInvites$,
	type Invite,
	type GameHistoryItem,
} from "../../network/sockets";
import { Subscription } from "rxjs";
import type { PlayerDiv } from "../playerDiv/PlayerDiv";
import type { inviteDiv } from "../inviteDiv/inviteDiv";
import { authStore } from "../../utils/auth";

export class Dashboard extends HTMLElement {
	private root: ShadowRoot;
	private lobby: Subscription;
	private invites: Subscription;
	private localInvites: Invite[] = [];
	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });

		this.root.innerHTML = `
    <style>${styles}</style>
	<app-navbar></app-navbar>
	<div class="flex-container">
	<player-list></player-list>
	<invite-list></invite-list>
	</div>
    `;
		this.lobby = playerList$.subscribe((players) => {
			const playerContainer = this.root.querySelector("player-list");
			if (!playerContainer) return;

			playerContainer.innerHTML = "";
			for (const player of players) {
				const playerElem = document.createElement("player-div") as PlayerDiv;
				playerElem.username = player.username;
				playerContainer.appendChild(playerElem);
			}
		});

		this.invites = playerInvites$.subscribe((invites) => {
			if (JSON.stringify(invites) !== JSON.stringify(this.localInvites)) {
				this.localInvites = invites;

				const inviteContainer = this.root.querySelector("invite-list");
				if (!inviteContainer) return;

				inviteContainer.innerHTML = "";

				for (const invite of this.localInvites) {
					const inviteElem = document.createElement("invite-div") as inviteDiv;
					inviteElem.username = invite.from;
					inviteElem.inviteId = invite.inviteId;
					inviteContainer.appendChild(inviteElem);
				}
			}
		});
	}

	connectedCallback() {
		this.root
			.querySelector("app-navbar")!
			.addEventListener("navigate-history", () => {
				this.getGameHistory();
			});

		this.root
			.querySelector("app-navbar")!
			.addEventListener("navigate-lobby", () => {
				const lobbyDash = this.root.querySelector(".flex-container");
				lobbyDash?.replaceChildren();
				const players = document.createElement("player-list");
				const invites = document.createElement("invite-list");
				lobbyDash?.appendChild(players);
				lobbyDash?.appendChild(invites);
			});
	}

	getGameHistory() {
		const storageKey = "gameHistory";

		const data: Record<string, GameHistoryItem[]> = JSON.parse(
			localStorage.getItem(storageKey) ?? "{}",
		);

		const matchHistoryData = Object.values(data).flat();

		const matchHistory = document.createElement("div");
		matchHistory.classList.add("flex-container");
		for (const match of matchHistoryData) {
			const matchDiv = document.createElement("div");
			matchDiv.classList.add("match");
			const winner = document.createElement("h3");
			winner.classList.add("winner");
			if (match.winner === authStore.getUser()?.username) {
				matchDiv.classList.add("win");
				winner.innerText = "You";
			} else {
				matchDiv.classList.add("loss");
				winner.innerText = match.winner;
			}
			const reason = document.createElement("p");
			reason.innerText = "Reason: " + match.reason;
			matchDiv.appendChild(winner);
			matchDiv.appendChild(reason);
			matchHistory.appendChild(matchDiv);
		}
		this.root.querySelector(".flex-container")?.replaceChildren(matchHistory);
	}

	disconnectedCallback() {
		this.lobby?.unsubscribe();

		this.invites?.unsubscribe();

		const playerContainer = this.root.querySelector("player-list");
		if (playerContainer) playerContainer.innerHTML = "";

		const inviteContainer = this.root.querySelector("invite-list");
		if (inviteContainer) inviteContainer.innerHTML = "";

		this.localInvites = [];
	}
}

customElements.define("app-dashboard", Dashboard);
