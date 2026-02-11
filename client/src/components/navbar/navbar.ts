import styles from "./navbar.scss?inline";
export class Navbar extends HTMLElement {

  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });

    this.root.innerHTML = `
    <style>${styles}</style>
    <div>
        <a href="">Game</a>
        <a href="">Match History</a>
    </div>
    
    `;
  }

 connectedCallback() {
 }

}

customElements.define("app-navbar", Navbar);
