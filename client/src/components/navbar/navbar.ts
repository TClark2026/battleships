import styles from "./navbar.scss?inline";
export class Navbar extends HTMLElement {
  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });

    this.root.innerHTML = `
    <style>${styles}</style>
    <div>
        <span class="lobby">Lobby</span>
        <span class="match-history">Match History</span>
		<span class="profile">Profile</span>
    </div>
    
    `;
  }

  connectedCallback() {
    this.root.querySelector(".profile")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("navigate-profile", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    this.root.querySelector(".match-history")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("navigate-history", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    this.root.querySelector(".lobby")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("navigate-lobby", {
          bubbles: true,
          composed: true,
        }),
      );
    });
  }
}

customElements.define("app-navbar", Navbar);
