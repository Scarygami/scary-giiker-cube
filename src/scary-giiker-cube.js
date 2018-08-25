import {LitElement, html} from '@polymer/lit-element';
import {setPassiveTouchGestures} from '@polymer/polymer/lib/utils/settings.js';
import '../node_modules/@polymer/app-layout/app-header-layout/app-header-layout.js';
import '../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-button';
import '@scarygami/scary-cube';
import '@scarygami/scary-stopwatch';
import './scary-giiker-session.js';
import GiiKER from 'giiker';
import cubeScrambler from 'cube-scrambler';
import {convertGiikerData} from './utils.js';

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
      _error: String,
      _mode: Number,
      _sequence: String,
      _battery: Number,
      _times: Array
    };
  }

  constructor () {
    super();
    setPassiveTouchGestures(true);
    this._error = '';
    this._moves = [];
    this._lastmove = 0;
    this._sequence = [];
    this._mode = modes.disconnected;
  }

  _render ({_mode, _error, _sequence, _times}) {
    const style = html`
      <style>
        :host {
          font-family: Roboto, sans-serif;
          font-size: 16px;
        }

        #content {
          flex: 1;
          flex-basis: 0.000000001px;
          display: flex;
          flex-direction: column;
        }

        app-header {
          background-color: #8fb;
        }

        app-toolbar {
          height: 40px;
          padding: 0 8px;
          --app-toolbar-font-size: 16px;
          justify-content: center;
        }

        paper-button {
          padding: 2px 4px;
          background-color: white;
        }

        app-toolbar > * {
          margin: 0 4px;
        }

        scary-cube {
          width: 100%;
          flex: 1;
          flex-basis: 0.000000001px;
          --cube-color-f: #8fb;
          --cube-color-r: #fcc;
          --cube-color-b: #38f;
          --cube-color-l: #f40;
          --cube-color-d: #ff5;
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
          color: #CCC;
        }
       </style>
    `;

    let controls = html``;
    switch (_mode) {
      case modes.disconnected:
        controls = html`
          <paper-button raised on-click=${this._connect.bind(this)}>Connect</paper-button>
        `;
        break;
      case modes.idle:
        controls = html`
          <paper-button raised on-click=${this._disconnect.bind(this)}>Disconnect</paper-button>
          <paper-button raised on-click=${this._reset.bind(this)}>Reset Cube</paper-button>
          <paper-button raised on-click=${this._startSession.bind(this)}>New Session</paper-button>
        `;
        break;
      case modes.scrambling:
        controls = html`
          <paper-button button on-click=${this._ready.bind(this)}>Scramble finished</paper-button>
          <paper-button button on-click=${this._cancel.bind(this)}>Cancel</paper-button>
        `;
        break;
      case modes.ready:
        controls = html`
          <paper-button on-click=${this._startTimer.bind(this)}>Start timer</paper-button>
          <paper-button button on-click=${this._cancel.bind(this)}>Cancel</paper-button>
        `;
        break;
      case modes.solving:
        controls = html`
          <button on-click=${this._stopTimer.bind(this)}>Stop timer</paper-button>
        `;
        break;
    }

    let info;
    let message;
    switch (_mode) {
      case modes.disconnected:
        if (_error) {
          message = _error;
        } else {
          message = 'Use the button above to connect to your GiiKER cube.';
        }
        break;
      case modes.idle:
        message = 'Start a new session with the button above.';
        break;
      case modes.scrambling:
        info = html`
          ${_sequence.map((move) => {
            return html`<span class="move" next?=${move.next} done?=${move.done} wrong?=${move.wrong} incomplete?=${move.incomplete}>${move.move}</span>`;
          })}`;
        message = 'Follow these moves to scramble your cube:';
        break;
      case modes.ready:
      case modes.solving:
        info = html`<scary-stopwatch></scary-stopwatch>`;
        if (_mode === modes.ready) {
          message = 'Timer will start automatically on your first move.';
        } else {
          message = 'Timer will stop automatically, when the cube is solved.';
        }
        break;
    }
    if (message) {
      message = html`<div id="message">${message}</div>`;
    }
    if (info) {
      info = html`<div id="info">${info}</div>`;
    }

    let times;
    if (_times && _times.length > 0) {
      times = html`<scary-giiker-session times="${_times}"></scary-giiker-session>`;
    }

    return html`
      ${style}
      <app-header-layout fullbleed has-scrolling-region>
        <app-header slot="header">
          <app-toolbar>${controls}</app-toolbar>
        </app-header>
        <div id="content">
          ${message}
          ${info}
          <scary-cube on-cube-solved=${this._solved.bind(this)}></scary-cube>
          ${times}
        </div>
      </app-header-layout>
    `;
  }

  ready () {
    super.ready();
  }

  _connect () {
    this._error = '';
    this._moves = [];
    GiiKER.connect().then((giiker) => {
      this._giiker = giiker;
      giiker.on('move', this._handleMove.bind(this));
      this._battery = giiker.batteryLevel;
      giiker.on('battery-changed', (data) => {
        this._battery = data.level;
      });
      giiker.on('disconnected', () => {
        this._mode = modes.disconnected;
        this._moves = [];
        this._error = '';
        this._giiker = null;
      });
      this._mode = modes.idle;
      const faces = convertGiikerData(giiker.state);
      this.shadowRoot.querySelector('scary-cube').faces = faces;
    }).catch((e) => {
      this._error = e.message;
    });
  }

  _disconnect () {
    if (!this._giiker) {
      this.mode = modes.disconnected;
      this._moves = [];
      this._error = '';
      return;
    }
    this._giiker.disconnect();
  }

  _startSession () {
    if (this._mode !== modes.idle) {
      return;
    }
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
    this._mode = modes.scrambling;
  }

  _ready() {
    this._mode = modes.ready;
  }

  _startTimer() {
    this._mode = modes.solving;
    this.shadowRoot.querySelector('scary-stopwatch').start();
  }

  _solved() {
    if (this._mode === modes.solving) {
      this._stopTimer();
    }
  }

  _stopTimer() {
    const stopwatch = this.shadowRoot.querySelector('scary-stopwatch');
    stopwatch.stop();
    const time = stopwatch.time;
    this._mode = modes.idle;
    this._times = [...this._times, time];
    stopwatch.reset();
    this._scramble();
  }

  _cancel () {
    const stopwatch = this.shadowRoot.querySelector('scary-stopwatch');
    if (stopwatch) {
      stopwatch.stop();
      stopwatch.reset();
    }
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
            sequence[currentIndex + 1].next = true;
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
          sequence[currentIndex + 1].next = true;
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
    }

    this._sequence = sequence;
    if (ready) {
      this._ready();
    }
  }

  _handleMove (move) {
    const now = Date.now();
    move = move.notation;
    this.shadowRoot.querySelector('scary-cube').addMove(move);
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

  _reset() {
    this.shadowRoot.querySelector('scary-cube').reset();
  }
}

window.customElements.define(ScaryGiikerCube.is, ScaryGiikerCube);
