import {LitElement, html} from '@polymer/lit-element';
import '@scarygami/scary-cube';
import '../node_modules/@polymer/app-layout/app-header-layout/app-header-layout.js';
import '../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import GiiKER from 'giiker';

const moveCombos = {
  "RL'": "M",
  "L'R": "M",
  "R'L": "M'",
  "LR'": "M'",
  "UD'": "E",
  "D'U": "E",
  "U'D": "E'",
  "DU'": "E'",
  "BF'": "S",
  "F'B": "S",
  "B'F": "S'",
  "FB'": "S'"
}

/**
 * @customElement
 * @polymer
 */
class ScaryGiikerCube extends LitElement {
  static get properties() {
    return {
      _message: String,
      _moves: Array,
      _connected: Boolean,
      _sequence: String,
      _battery: Number
    };
  }

  constructor () {
    super();
    this._message = 'v0.0.4';
    this._connected = false;
    this._moves = [];
    this._lastmove = 0;
    this._sequence = '';
  }

  _render ({_message, _moves, _sequence, _battery, _connected}) {
    return html`
      <style>
        #content {
          -ms-flex: 1 1 0.000000001px;
          -webkit-flex: 1;
          flex: 1;
          -webkit-flex-basis: 0.000000001px;
          flex-basis: 0.000000001px;
          display: -ms-flexbox;
          display: -webkit-flex;
          display: flex;
          -ms-flex-direction: column;
          -webkit-flex-direction: column;
          flex-direction: column;
        }

        scary-cube {
          width: 100%;
          -ms-flex: 1 1 0.000000001px;
          -webkit-flex: 1;
          flex: 1;
          -webkit-flex-basis: 0.000000001px;
          flex-basis: 0.000000001px;
          --cube-color-f: #8fb;
          --cube-color-r: #fcc;
          --cube-color-b: #38f;
          --cube-color-l: #f40;
          --cube-color-d: #ff5;
          --cube-speed: 0.1s;
        }

        #footer {
          height: 20%;
          font-weight: bold;
          text-align: center;
          overflow-y: scroll;
          background-color: #EEE;
        }

        #footer > * {
          display: inline-block;
          margin-left: 5px;
        }

      </style>

      <app-header-layout fullbleed has-scrolling-region>
        <app-header slot="header">
          <button on-click=${this._connect.bind(this)} disabled?=${_connected}>Connect</button>
          <span>${_message}</span>
          <span>${_battery}%</span>
          <button on-click=${this._reset.bind(this)}>Reset Cube</button>
          <button on-click=${this._scramble.bind(this)}>New Scramble</button><br>
          <span>${_sequence}</span>
        </app-header>
        <div id="content">
          <scary-cube></scary-cube>
          <div id="footer">${_moves.map((move) => html`<span>${move}</span>`)}</div>
        </div>
      </app-header-layout>
    `;
  }

  ready () {
    super.ready();
  }

  _connect () {
    this._message = '';
    this._moves = [];
    GiiKER.connect().then((giiker) => {
      this._connected = true;
      this._message = "connected";
      giiker.on('move', this._handleMove.bind(this));
      this._battery = giiker.batteryLevel;
      giiker.on('battery-changed', (data) => {
        this._battery = data.level;
      });
    }).catch((e) => {
      this._message = e.message;
    });
  }

  _handleMove (move) {
    const now = Date.now();
    move = move.notation;
    this.shadowRoot.querySelector('scary-cube').addMove(move);
    const moves = [...this._moves];

    if (now - this._lastmove < 500) {
      const lastMove = moves.pop();
      if (lastMove) {
        if (lastMove === move) {
          // Double layer move
          moves.push(move[0] + '2');
        } else {
          if (moveCombos[lastMove + move]) {
            moves.push(moveCombos[lastMove + move])
          } else {
            moves.push(lastMove);
            moves.push(move);
          }
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

  _scramble() {
    //this._sequence = cubeScrambler.scramble().join(' ');
  }

  _reset() {
    this._moves = [];
    this.shadowRoot.querySelector('scary-cube').reset();
  }
}

window.customElements.define('scary-giiker-cube', ScaryGiikerCube);
