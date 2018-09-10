import {LitElement, html} from '@polymer/lit-element';
import {formatTimestamp, formatDate, formatSeconds} from './utils.js';
import db from './scary-giiker-db.js';
import '@polymer/paper-button';

class ScaryGiikerHistory extends LitElement {
  static get is() {
    return 'scary-giiker-history';
  }

  static get properties() {
    return {
      _sessions: Array,
      _sessionId: Number
    };
  }

  constructor() {
    super();
    db.sessions.then((sessions) => {
      this._sessions = [...sessions].sort((a, b) => (b.date - a.date));
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this._boundSessionListener = this._sessionListener.bind(this);
    db.on('sessions-changed', this._boundSessionListener);
  }

  disconnectedCallback() {
    db.off('sessions-changed', this._boundSessionListener);
  }

  render() {
    const session = this._sessions.filter((session) => session.id === this._sessionId)[0];
    const bestTimes = this._sessions.map((session) => session.best);
    const best = Math.min(...bestTimes);
    const bestao5s = this._sessions.map((session) => session.bestao5).filter((bestao5) => !!bestao5);
    const bestao5 = Math.min(...bestao5s);

    let sessionDetails = html``;
    if (session) {
      sessionDetails = html`
        <div class="section">
          <div class="title">Session details: ${formatDate(session.date)}</div>
          <table><tr>
            <td>Best</td><td class="bold">${formatTimestamp(session.best)}</td>
            <td>Mean</td><td class="bold">${formatTimestamp(session.mean)}</td>
          </tr>
          <tr>
            <td>Best Ao5</td><td class="bold">${formatTimestamp(session.bestao5)}</td>
            <td>Last Ao5</td><td class="bold">${formatTimestamp(session.ao5)}</td>
          </tr></table>
          <table>
            <tr><th>Time</th><th>Cross</th><th>First pair</th><th>F2L</th><th>OLL</th><th>PLL</th></tr>
            ${session.history.map((solve) => html`<tr>
              <td class="bold">${formatTimestamp(solve.time)}</td>
              <td>${formatSeconds(solve.cross)}</td>
              <td>${formatSeconds(solve.firstPair)}</td>
              <td>${formatSeconds(solve.F2L)}</td>
              <td>${formatSeconds(solve.OLL)}</td>
              <td>${formatSeconds(solve.PLL)}</td>
            </tr>`)}
          </table>
          <paper-button @click=${this._deleteSession.bind(this)} raised>Delete session</paper-button>
        </div>`;
    }

    return html`
      <style>
        :host {
          padding: 2px;
          display: flex;
          flex-direction: column;
        }

        .section {
          flex: 1;
          flex-basis: 0.000000001px;
          overflow-y: auto;
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

        .wrap {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }

        .wrap > * {
          margin: 2px;
        }

        .title {
          text-align: center;
          font-weight: bold;
          border-bottom: 1px solid #ccc;
        }

        .bold {
          font-weight: bold;
        }
      </style>
      <div class="section">
        <table>
          <tr><th>Date</th><th>Best</th><th>Best Ao5</th></tr>
          ${this._sessions.map((session) => html`
            <tr data-id=${session.id} @click=${this._showSession.bind(this)}>
              <td>${formatDate(session.date)}</td>
              <td class="${(session.best === best ? 'bold' : '')}">${formatTimestamp(session.best)}</td>
              <td class="${(session.bestao5 === bestao5 ? 'bold' : '')}">${formatTimestamp(session.bestao5)}</td>
            </tr>`)}
        </table>
      </div>
      ${sessionDetails}
    `;
  }

  _sessionListener(details) {
    this._sessions = [...details.sessions].sort((a, b) => (b.date - a.date));
  }

  _showSession (e) {
    this._sessionId = parseInt(e.currentTarget.dataset.id, 10);
  }

  _deleteSession() {
    if (!this._sessionId) {
      return;
    }
    db.deleteSession(this._sessionId).then(() => {
      this._sessionId = undefined;
    });
  }
}

window.customElements.define(ScaryGiikerHistory.is, ScaryGiikerHistory);