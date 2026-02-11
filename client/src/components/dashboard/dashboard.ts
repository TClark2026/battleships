import styles from "./dashboard.scss?inline";
import "../navbar/navbar";
export class Dashboard extends HTMLElement {

  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });

    this.root.innerHTML = `
    <style>${styles}</style>
    <app-navbar></app-navbar>
    
    `;
  }

 connectedCallback() {
 }

}

customElements.define("app-dashboard", Dashboard);
