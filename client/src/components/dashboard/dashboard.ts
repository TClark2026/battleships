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
      .addEventListener("navigate-profile", () => {
        this.getProfile();
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

  getProfile() {
    const profileContainer = document.createElement("div");
    profileContainer.classList.add("flex-container");

    const username = authStore.getUser()!.username;
    const profile = document.createElement("h2");
    profile.innerText = "You are: " + username;

    const logoutButton = document.createElement("button");
    logoutButton.innerText = "Log Out";
    logoutButton.classList.add("logout-button");
    logoutButton.addEventListener("click", () => {
      location.reload();
      authStore.clearAuth();
    });
    profileContainer.appendChild(profile);
    profileContainer.appendChild(logoutButton);

    this.root
      .querySelector(".flex-container")
      ?.replaceChildren(profileContainer);
  }

  getGameHistory() {
    const storageKey = "gameHistory";

    const data: Record<string, GameHistoryItem[]> = JSON.parse(
      localStorage.getItem(storageKey) ?? "{}",
    );

    const matchHistoryData = Object.values(data).flat();

    const matchHistory = document.createElement("div");
    matchHistory.classList.add("flex-container", "match-history");

    if (matchHistoryData.length === 0) {
      const emptyHeading = document.createElement("h2");
      emptyHeading.innerText = "No History Available";
      matchHistory.appendChild(emptyHeading);
    } else {
      for (const match of matchHistoryData) {
        const matchDiv = document.createElement("div");
        matchDiv.classList.add("match");

        const header = document.createElement("div");
        header.classList.add("match__header");

        const winner = document.createElement("h3");
        winner.classList.add("match__winner");

        const badge = document.createElement("span");
        badge.classList.add("match__badge");

        const isWin = match.winner === authStore.getUser()?.username;
        if (isWin) {
          matchDiv.classList.add("match--win");
          winner.innerText = "You";
          badge.innerText = "WIN";
        } else {
          matchDiv.classList.add("match--loss");
          winner.innerText = match.winner;
          badge.innerText = "LOSS";
        }

        const reason = document.createElement("p");
        reason.classList.add("match__reason");
        reason.innerText = match.reason;

        header.appendChild(winner);
        header.appendChild(badge);

        matchDiv.appendChild(header);
        matchDiv.appendChild(reason);
        matchHistory.appendChild(matchDiv);
      }
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
