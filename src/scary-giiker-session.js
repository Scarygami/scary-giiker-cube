import {LitElement, html} from '@polymer/lit-element';
import '@polymer/paper-tooltip';

function formatTimestamp(ms) {
  if (!ms && ms !== 0) {
    return '-';
  }
  const milliseconds = ms % 1000;
  ms = (ms - milliseconds) / 1000;
  const seconds = ms % 60;
  ms = (ms - seconds) / 60;
  const minutes = ms % 60;
  const hours = (ms - minutes) / 60;

  let display = '';
  if (hours > 0) {
    display += ('0' + hours.toString(10)).slice(-2) + ':';
  }

  display += ('0' + minutes.toString(10)).slice(-2) + ':';
  display += ('0' + seconds.toString(10)).slice(-2) + '.';
  display += ('00' + milliseconds.toString(10)).slice(-3);

  return display;
}

function formatSeconds(ms) {
  if (!ms && ms !== 0) {
    return '-';
  }
  const milliseconds = ms % 1000;
  ms = (ms - milliseconds) / 1000;
  const seconds = ms % 60;

  let display = seconds.toString(10);
  display += '.' + ('00' + milliseconds.toString(10)).slice(-3);
  return display;
}

function formatSplit(time) {
  return html`
    <span>Cross:&nbsp;${formatSeconds(time.cross)}&nbsp;|</span>
    <span>First&nbsp;Pair:&nbsp;${formatSeconds(time.firstPair)}&nbsp;|</span>
    <span>F2L:&nbsp;${formatSeconds(time.F2L)}&nbsp;|</span>
    <span>OLL:&nbsp;${formatSeconds(time.OLL)}&nbsp;|</span>
    <span>PLL:&nbsp;${formatSeconds(time.PLL)}</span>`;
}

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

  render () {
    const style = html`
      <style>
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

        #latest {
          text-align: center;
          font-weight: bold;
          font-size: 150%;
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

      </style>
    `;
    if (!this.session) {
      return html``;
    }

    return html`
      ${style}
      <div id="latest">${formatTimestamp(this.session.history[0].time)}</div>
      <div class="wrap">
        <span>Cross: ${formatSeconds(this.session.history[0].cross)} |</span>
        <span>First Pair: ${formatSeconds(this.session.history[0].firstPair)} |</span>
        <span>F2L: ${formatSeconds(this.session.history[0].F2L)} |</span>
        <span>OLL: ${formatSeconds(this.session.history[0].OLL)} |</span>
        <span>PLL: ${formatSeconds(this.session.history[0].PLL)}</span>
      </div>
      <div class="wrap">
        <span>Best: ${formatTimestamp(this.session.best)} |</span>
        <span>Mean: ${formatTimestamp(this.session.mean)} |</span>
        <span>Ao5: ${formatTimestamp(this.session.ao5)} |</span>
        <span>Best Ao5: ${formatTimestamp(this.session.bestao5)}</span>
      </div>
      <div class="wrap">
        ${this.session.history.map((time, index) => html`<div>
          <span>${(index !== 0) ? '| ' : ''}${formatTimestamp(time.time)}</span>
          <paper-tooltip position="top">${formatSplit(time)}</paper-tooltip>
        </div>`)}
      </div>
    `;
  }
}

window.customElements.define(ScaryGiikerSession.is, ScaryGiikerSession);