import {LitElement, html} from '@polymer/lit-element';
import {setPassiveTouchGestures, setRootPath} from '@polymer/polymer/lib/utils/settings.js';
import '../node_modules/@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '../node_modules/@polymer/app-layout/app-drawer/app-drawer.js';
import '../node_modules/@polymer/app-layout/app-header-layout/app-header-layout.js';
import '../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-button';
import '@polymer/paper-icon-button';
import '@polymer/paper-swatch-picker';

import '@scarygami/scary-cube';
import '@scarygami/scary-stopwatch';
import './scary-giiker-session.js';
import './scary-giiker-icons.js';
import GiiKER from 'giiker';
import cubeScrambler from 'cube-scrambler';
import {convertGiikerData} from './utils.js';

setPassiveTouchGestures(true);
setRootPath(window.MyAppGlobals.rootPath);

const noSleep = new window.NoSleep();

const modes = {
  disconnected: 0,
  idle: 1,
  scrambling: 2,
  ready: 3,
  solving: 4
};

/**
 * @customElement
 * @polymer
 */
class ScaryGiikerCube extends LitElement {
  static get is() {
    return 'scary-giiker-cube';
  }

  static get properties() {
    return {
      updateAvailable: Boolean,
      _error: String,
      _mode: Number,
      _sequence: String,
      _times: Array,
      _install: Boolean,
      _colors: Object
    };
  }

  static get originalColors() {
    return {
      'U': '#FFFFFF',
      'D': '#FFFF55',
      'L': '#FF4400',
      'R': '#FFCCCC',
      'F': '#88FFBB',
      'B': '#3388FF',
    }
  }

  constructor () {
    super();
    this._error = '';
    this._moves = [];
    this._lastmove = 0;
    this._sequence = [];
    this._mode = modes.disconnected;
    this._install = false;
    if (window.localStorage.colors) {
      this._colors = JSON.parse(window.localStorage.colors);
    } else {
      this._colors = ScaryGiikerCube.originalColors;
    }
  }

  connectedCallback () {
    super.connectedCallback();

    window.addEventListener('beforeinstallprompt', this._installPrompt.bind(this));
  }

  render () {
    const style = html`
      <style>
        :host {
          font-family: Roboto, sans-serif;
          font-size: 16px;
          --app-drawer-width: 300px;
        }

        #content {
          flex: 1;
          flex-basis: 0.000000001px;
          display: flex;
          flex-direction: column;
        }

        #drawer {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4px;
        }

        #drawer > * {
          margin: 4px;
        }

        #drawer > .spacer {
          width: 100%;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #CCC;
        }

        #colors {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          margin: 4px 16px;
        }

        #colors > * {
          margin: 4px;
          width: 80px;
        }

        app-header {
          background-color: #88FFBB;
        }

        app-toolbar {
          height: 52px;
          padding: 0 8px;
          --app-toolbar-font-size: 16px;
          justify-content: space-between;
        }

        app-toolbar > * {
          margin: 0 4px;
        }

        paper-button {
          padding: 4px;
          background-color: white;
          text-transform: none;
        }

        paper-swatch-picker {
          background-color: #EEE;
          border-radius: 50%;
        }

        scary-cube {
          width: 100%;
          flex: 1;
          flex-basis: 0.000000001px;
          --cube-speed: 0.1s;
        }

        #info {
          padding: 2px;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
        }

        #message {
          margin-top: 8px;
          padding: 2px;
          text-align: center;
        }

        #info > * {
          margin: 2px;
        }

        scary-stopwatch {
          text-align: center;
          font-size: 32px;
        }

        .move {
          font-size: 24px;
        }

        [done] {
          color: green;
        }

        [wrong] {
          color: red;
          font-weight: bold;
        }

        [next] {
          font-weight: bold;
          font-size: 40px;
        }

        [incomplete] {
          color: #CCCCCC;
        }

        [hidden] {
          display: none;
        }
       </style>
    `;

    let controls = html``;
    switch (this._mode) {
      case modes.disconnected:
        controls = html`
          <paper-button raised @click=${this._connect.bind(this)}>Connect</paper-button>
        `;
        break;
      case modes.idle:
        controls = html`
          <paper-button raised @click=${this._disconnect.bind(this)}>Disconnect</paper-button>
          <paper-button raised @click=${this._startSession.bind(this)}>New Session</paper-button>
        `;
        break;
      case modes.scrambling:
        controls = html`
          <paper-button button @click=${this._ready.bind(this)}>Scramble finished</paper-button>
          <paper-button button @click=${this._cancel.bind(this)}>Cancel</paper-button>
        `;
        break;
      case modes.ready:
        controls = html`
          <paper-button @click=${this._startTimer.bind(this)}>Start timer</paper-button>
          <paper-button button @click=${this._cancel.bind(this)}>Cancel</paper-button>
        `;
        break;
      case modes.solving:
        controls = html`
          <paper-button @click=${this._stopTimer.bind(this)}>Stop timer</paper-button>
        `;
        break;
    }

    let info;
    let message;
    let showTimer = false;
    let connected = true;
    switch (this._mode) {
      case modes.disconnected:
        if (this._error) {
          message = this._error;
        } else {
          message = 'Use the button above to connect to your GiiKER cube.';
        }
        connected = false;
        break;
      case modes.idle:
        message = 'Start a new session with the button above.';
        break;
      case modes.scrambling:
        info = html`
          ${this._sequence.map((move) => {
            return html`<span class="move" ?next=${move.next} ?done=${move.done} ?wrong=${move.wrong} ?incomplete=${move.incomplete}>${move.move}</span>`;
          })}`;
        message = 'Follow these moves to scramble your cube:';
        break;
      case modes.ready:
        showTimer = true;
        message = 'Timer will start automatically on your first move.';
        break;
      case modes.solving:
        showTimer = true;
        message = 'Timer will stop automatically, when the cube is solved.';
        break;
    }
    if (message) {
      message = html`<div id="message">${message}</div>`;
    }
    if (info) {
      info = html`<div id="info">${info}</div>`;
    }

    const showTimes = (this._times && this._times.length > 0);

    return html`
      ${style}
      <app-drawer-layout fullbleed force-narrow>
        <app-drawer slot="drawer" align="right">
          <div id="drawer">
            <span>CFOP-Times will be measured assuming the cross being on U (white) and the last layer being D (yellow). Change the colors in case you are solving the cross on a different side.</span>
            <div id="colors">
              ${Object.keys(this._colors).map((face) => {
                return html`<span>${face} <paper-swatch-picker data-face=${face}
                                                color=${this._colors[face]}
                                                column-count=6
                                                color-list='["#ffffff", "#ffffff", "#88ffbb", "#00ff00", "#ffcccc", "#ff0000", "#ffff55", "#ffff00", "#3388ff", "#0000ff", "#ff4400", "#ff9900"]'
                                                @color-changed=${this._colorChanged.bind(this)}></paper-swatch-picker></span>`;
              })}
            </div>
            <span class="spacer">Warning: this will reset the GiiKER cube's internal state to "solved" in case it got out of sync.</span>
            <paper-button raised @click=${this._reset.bind(this)}>Reset</paper-button>
          </div>
        </app-drawer>
        <app-header-layout fullbleed has-scrolling-region>
          <app-header slot="header">
            <app-toolbar>
              <img src="/images/manifest/logo-48.png" alt="scary-cube logo">
              ${controls}
              <paper-icon-button icon="scary:install" ?hidden=${!this._install} @click=${this._installClick.bind(this)}></paper-icon-button>
              <paper-icon-button icon="scary:refresh" ?hidden=${!this.updateAvailable} @click=${this._refresh.bind(this)}></paper-icon-button>
              <paper-icon-button icon="scary:settings" ?hidden=${!connected} drawer-toggle></paper-icon-button>
            </app-toolbar>
          </app-header>
          <div id="content">
            ${message}
            ${info}
            <scary-stopwatch ?hidden=${!showTimer}></scary-stopwatch>
            <scary-cube id="cube" @cube-solved=${this._solved.bind(this)}
                        style="--cube-color-u: ${this._colors.U}; --cube-color-f: ${this._colors.F}; --cube-color-r: ${this._colors.R}; --cube-color-b: ${this._colors.B}; --cube-color-l: ${this._colors.L}; --cube-color-d: ${this._colors.D};"></scary-cube>
            <scary-giiker-session ?hidden=${!showTimes} .times="${this._times}"></scary-giiker-session>
          </div>
        </app-header-layout>
      </app-drawer-layout>
    `;
  }

  firstUpdated () {
    this._scaryCube = this.shadowRoot.querySelector('scary-cube');
    this._scaryStopwatch = this.shadowRoot.querySelector('scary-stopwatch');
  }

  _connect () {
    this._error = '';
    this._moves = [];
    GiiKER.connect().then((giiker) => {
      this._giiker = giiker;
      giiker.on('move', this._handleMove.bind(this));
      giiker.on('disconnected', () => {
        this._mode = modes.disconnected;
        this._moves = [];
        this._error = '';
        this._giiker = null;
        noSleep.disable();
      });
      this._mode = modes.idle;
      const faces = convertGiikerData(giiker.state);
      this._scaryCube.faces = faces;
    }).catch((e) => {
      this._error = e.message;
    });
  }

  _disconnect () {
    if (!this._giiker) {
      this._mode = modes.disconnected;
      this._moves = [];
      this._error = '';
      return;
    }
    this._giiker.disconnect();
  }

  _colorChanged (e) {
    const face = e.target.dataset.face;
    const color = e.detail.value;
    if (color === this._colors[face]) {
      return;
    }
    this._colors[face] = color;
    this._colors = JSON.parse(JSON.stringify(this._colors));
    window.localStorage.colors = JSON.stringify(this._colors);
  }

  _startSession () {
    if (this._mode !== modes.idle) {
      return;
    }
    noSleep.enable();
    this._times = [];
    this._scramble();
  }

  _scramble() {
    if (this._mode !== modes.idle) {
      return;
    }
    cubeScrambler.reset();
    const moves = cubeScrambler.scramble();
    this._sequence = moves.map(move => ({
      move: move
    }));

    this._sequence[0].next = true;
    this._scaryCube.hint(this._sequence[0].move);
    this._mode = modes.scrambling;
  }

  _ready () {
    this._mode = modes.ready;
  }

  _startTimer () {
    this._mode = modes.solving;
    this._scaryStopwatch.start();
  }

  _solved () {
    if (this._mode === modes.solving) {
      this._stopTimer();
    }
  }

  _stopTimer () {
    this._scaryStopwatch.stop();
    const time = this._scaryStopwatch.time;
    this._mode = modes.idle;
    this._times = [...this._times, time];
    this._scaryStopwatch.reset();
    this._scramble();
  }

  _cancel () {
    noSleep.disable();
    this._scaryStopwatch.stop();
    this._scaryStopwatch.reset();
    this._mode = modes.idle;
    this._moves = [];
  }

  _checkScramble (move) {
    if (this._mode !== modes.scrambling) {
      return;
    }
    const sequence = [...this._sequence];
    let currentIndex = 0;
    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i].next) {
        currentIndex = i;
        break;
      }
    }

    let ready = false;
    if (move === sequence[currentIndex].move) {
      if (sequence[currentIndex].correction) {
        const fix = sequence[currentIndex].fix;
        sequence.splice(currentIndex - 1, 2);
        currentIndex = currentIndex - 2;
        if (fix) {
          sequence[currentIndex].next = false;
          sequence[currentIndex].done = true;
          if (currentIndex === sequence.length - 1) {
            ready = true;
          } else {
            currentIndex++;
            sequence[currentIndex].next = true;
          }
        } else {
          sequence[currentIndex].next = true;
        }
      } else {
        sequence[currentIndex].done = true;
        sequence[currentIndex].next = false;
        if (currentIndex === sequence.length - 1) {
          ready = true;
        } else {
          currentIndex++;
          sequence[currentIndex].next = true;
        }
      }
    } else {
      let rightMove = sequence[currentIndex].move;
      sequence[currentIndex].next = false;
      const wrongMove = {
        move: move,
        wrong: true
      };
      const correction = {
        correction: true,
        next: true
      };
      if (move[0] === rightMove[0] && rightMove[1] === '2') {
        wrongMove.wrong = false;
        wrongMove.incomplete = true;
        correction.move = move;
        correction.fix = true;
      } else {
        // different face
        if (move[1] === "'") {
          correction.move = move[0];
        } else if (move[1] === '2') {
          correction.move = move;
        } else {
          correction.move = move[0] + "'";
        }
      }

      sequence.splice(currentIndex + 1, 0, wrongMove, correction);
      currentIndex = currentIndex + 2;
    }

    this._sequence = sequence;
    if (ready) {
      this._ready();
    } else {
      this._scaryCube.hint(sequence[currentIndex].move);
    }
  }

  _handleMove (move) {
    const now = Date.now();
    move = move.notation;
    this._scaryCube.addMove(move);
    if (this._mode === modes.scrambling) {
      this._checkScramble(move);
      return;
    }
    if (this._mode === modes.ready) {
      this._startTimer();
    }
    const moves = [...this._moves];

    if (now - this._lastmove < 500) {
      const lastMove = moves.pop();
      if (lastMove) {
        if (lastMove === move) {
          moves.push(move[0] + '2');
        } else {
          moves.push(lastMove);
          moves.push(move);
        }
      } else {
        moves.push(move);
      }
    } else {
      moves.push(move);
    }
    this._moves = moves;
    this._lastmove = now;
  }

  _reset () {
    this._giiker.resetState();
    this._scaryCube.reset();
  }

  /* Logic for handling Chrome's add to homescreen feature */
  _installPrompt (e) {
    e.preventDefault();
    this._deferredPrompt = e;
    this._install = true;
  }

  _installClick () {
    if (!this._deferredPrompt) {
      return;
    }
    this._install = false;
    this._deferredPrompt.prompt();
    this._deferredPrompt = null;
  }

  _refresh () {
    window.location.reload(true);
  }
}

window.customElements.define(ScaryGiikerCube.is, ScaryGiikerCube);
