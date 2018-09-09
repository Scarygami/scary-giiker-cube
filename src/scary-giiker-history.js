import {LitElement, html} from '@polymer/lit-element';
import {formatTimestamp, formatDate} from './utils.js';
import db from './scary-giiker-db.js';

class ScaryGiikerHistory extends LitElement {
  static get is() {
    return 'scary-giiker-history';
  }

  static get properties() {
    return {
      _sessions: Array
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
    return html`
      <style>
        :host {
          overflow-y: auto;
          padding: 2px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          text-align: left;
          border-bottom: 1px solid #ccc;
        }
      </style>
      <table>
        <tr><th>Date</th><th>Best</th><th>Best Ao5</th></tr>
        ${this._sessions.map((session) => html`
          <tr>
            <td>${formatDate(session.date)}</td>
            <td>${formatTimestamp(session.best)}</td>
            <td>${formatTimestamp(session.bestao5)}</td>
          </tr>`)}
      </table>
    `;
  }

  _sessionListener(details) {
    this._sessions = [...details.sessions].sort((a, b) => (b.date - a.date));
  }
}

window.customElements.define(ScaryGiikerHistory.is, ScaryGiikerHistory);