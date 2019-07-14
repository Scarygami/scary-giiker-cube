import {LitElement, html, css} from 'lit-element';
import '@polymer/paper-tooltip';
import {formatSeconds, formatTimestamp} from './utils.js';

/**
 * @customElement
 * @polymer
 */
class ScaryGiikerSession extends LitElement {
  static get is () {
    return 'scary-giiker-session';
  }

  static get properties () {
    return {
      session: Object
    };
  }

  constructor () {
    super();
    this.times = [];
  }

  static get styles() {
    return css`
      :host {
        padding: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      :host > div {
        width: 100%;
        margin: 2px 0;
        border-top: 1px solid #CCC;
      }

      table {
        margin: 8px auto;
        border-collapse: collapse;
      }

      th, td {
        text-align: right;
        border-bottom: 1px solid #ccc;
        padding: 2px 4px;
      }

      th {
        font-weight: normal;
      }

      [hidden] {
        display: none;
      }
    `;
  }

  render () {
    if (!this.session) {
      return html``;
    }

    return html`
      <table><tr>
        <td>Best</td><td class="bold">${formatTimestamp(this.session.best)}</td>
        <td>Mean</td><td class="bold">${formatTimestamp(this.session.mean)}</td>
      </tr>
      <tr>
        <td>Best Ao5</td><td class="bold">${formatTimestamp(this.session.bestao5)}</td>
        <td>Last Ao5</td><td class="bold">${formatTimestamp(this.session.ao5)}</td>
      </tr></table>
      <table>
        <tr><th>Time</th><th>Cross</th><th>First pair</th><th>F2L</th><th>OLL</th><th>PLL</th></tr>
        ${this.session.history.map((solve) => html`<tr>
          <td class="bold">${formatTimestamp(solve.time)}</td>
          <td>${formatSeconds(solve.cross)}</td>
          <td>${formatSeconds(solve.firstPair)}</td>
          <td>${formatSeconds(solve.F2L)}</td>
          <td>${formatSeconds(solve.OLL)}</td>
          <td>${formatSeconds(solve.PLL)}</td>
        </tr>`)}
      </table>
    `;
  }
}

window.customElements.define(ScaryGiikerSession.is, ScaryGiikerSession);