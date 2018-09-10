import Dexie from 'dexie';

class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(label, callback) {
    if (!this.listeners[label]) {
      this.listeners[label] = [];
    }
    this.listeners[label].push(callback);
  }

  off(label, callback) {
    let listeners = this.listeners[label];

    if (listeners && listeners.length > 0) {
      let index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
        this.listeners[label] = listeners;
        return true;
      }
    }
    return false;
  }

  emit(label, ...args) {
    let listeners = this.listeners[label];

    if (listeners && listeners.length > 0) {
      listeners.forEach((listener) => {
        listener(...args);
      });
      return true;
    }
    return false;
  }
}

class ScaryDB extends EventEmitter {
  constructor() {
    super();
    this._db = new Dexie('ScaryCubeDB');
    this._db.version(1).stores({
      sessions: '++id, date, best, bestao5'
    });
    this._sessions = [];
    this._promise = this._db.table('sessions').toArray();

    this._promise.then((sessions) => {
      this._sessions = sessions;
      this.notify();
    });
  }

  get sessions() {
    return this._promise.then(() => [...this._sessions]);
  }

  notify() {
    this.emit('sessions-changed', {sessions: [...this._sessions]});
  }

  async saveSession(session) {
    await this._promise;
    session.date = new Date();
    session.id = await this._db.sessions.add(session);
    this._sessions.push(session);
    this.notify();
  }

  async deleteSession(sessionId) {
    const index = this._sessions.findIndex((session) => (session.id === sessionId));
    if (index < 0) {
      return;
    }
    await this._promise;
    await this._db.sessions.delete(sessionId);
    this._sessions.splice(index, 1);
    this.notify();
  }
}

const db = new ScaryDB();

export default db;
