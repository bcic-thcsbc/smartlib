const session = require("express-session");
const { run, get } = require("./database/db");

class SqliteSessionStore extends session.Store {
  get(sid, callback) {
    get("SELECT data, expires_at FROM sessions WHERE session_id=?", [sid])
      .then((row) => {
        if (!row || row.expires_at <= Date.now())
          return run("DELETE FROM sessions WHERE session_id=?", [sid]).then(
            () => callback(null, null),
          );
        callback(null, JSON.parse(row.data));
      })
      .catch(callback);
  }
  set(sid, sess, callback) {
    const expires =
      sess.cookie && sess.cookie.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 28800000;
    run(
      "INSERT INTO sessions(session_id,data,expires_at) VALUES(?,?,?) ON CONFLICT(session_id) DO UPDATE SET data=excluded.data,expires_at=excluded.expires_at",
      [sid, JSON.stringify(sess), expires],
    )
      .then(() => callback && callback())
      .catch(callback);
  }
  destroy(sid, callback) {
    run("DELETE FROM sessions WHERE session_id=?", [sid])
      .then(() => callback && callback())
      .catch(callback);
  }
  touch(sid, sess, callback) {
    this.set(sid, sess, callback);
  }
  clear(callback) {
    run("DELETE FROM sessions")
      .then(() => callback && callback())
      .catch(callback);
  }
}

module.exports = SqliteSessionStore;
