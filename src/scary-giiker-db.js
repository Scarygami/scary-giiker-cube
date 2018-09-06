import Dexie from 'dexie';

const db = new Dexie('ScaryCubeDB');

db.version(1).stores({
  sessions: '++id, date, best, bestao5'
});

async function saveSession(session) {
  session.date = new Date();
  await db.sessions.add(session);
}

export {saveSession};
