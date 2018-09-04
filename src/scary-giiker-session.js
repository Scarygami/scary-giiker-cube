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

function calculateAo5(times) {
  if (times.length !== 5) {
    return null;
  }
  const best = Math.min(...times);
  const worst = Math.max(...times);
  const bestIndex = times.indexOf(best);
  const worstIndex = times.lastIndexOf(worst);

  const average = times.reduce((sum, time, index) => {
    if (index !== bestIndex && index !== worstIndex) {
      return sum + time;
    }
    return sum;
  }, 0) / 3;

  return average;
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
      times: Array
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
    if (!this.times || this.times.length === 0) {
      return html``;
    }
    const times = this.times.map((time) => time.time);

    const latest = this.times[this.times.length - 1];
    const best = Math.min(...times);
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    let ao5;
    let bestao5;

    if (times.length >= 5) {
      const ao5s = [];
      for (let i = 0; i < times.length - 4; i++) {
        const slice = times.slice(i, i + 5);
        ao5s.push(calculateAo5(slice));
      }

      ao5 = ao5s[ao5s.length - 1];
      bestao5 = Math.min(...ao5s);
    }

    const history = [...this.times].reverse();

    return html`
      ${style}
      <div id="latest">${formatTimestamp(latest.time)}</div>
      <div class="wrap">
        <span>Cross: ${formatSeconds(latest.cross)} |</span>
        <span>First Pair: ${formatSeconds(latest.firstPair)} |</span>
        <span>F2L: ${formatSeconds(latest.F2L)} |</span>
        <span>OLL: ${formatSeconds(latest.OLL)} |</span>
        <span>PLL: ${formatSeconds(latest.PLL)}</span>
      </div>
      <div class="wrap">
        <span>Best: ${formatTimestamp(best)} |</span>
        <span>Mean: ${formatTimestamp(mean)} |</span>
        <span>Ao5: ${formatTimestamp(ao5)} |</span>
        <span>Best Ao5: ${formatTimestamp(bestao5)}</span>
      </div>
      <div class="wrap">
        ${history.map((time, index) => html`<div>
          <span>${(index !== 0) ? '| ' : ''}${formatTimestamp(time.time)}</span>
          <paper-tooltip position="top">${formatSplit(time)}</paper-tooltip>
        </div>`)}
      </div>
    `;
  }
}

window.customElements.define(ScaryGiikerSession.is, ScaryGiikerSession);