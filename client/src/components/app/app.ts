import styles from "./app.scss?inline";
import "../navbar/navbar";
import "../dashboard/dashboard"
export class App extends HTMLElement {

  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });

    this.root.innerHTML = `
    <style>${styles}</style>
    <app-navbar></app-navbar>
    <app-dashboard></app-dashboard>
    
    `;
  }

 connectedCallback() {
 }

}

customElements.define("app-frame", App);
