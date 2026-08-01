const app = require("./app");
const initDatabase = require("./database/initDatabase");
const { db } = require("./database/db");
const { startNotificationScheduler } = require("./utils/notifications");
const { startReservationScheduler } = require("./utils/reservationLifecycle");
const port = process.env.PORT || 4000;
initDatabase()
  .then(() => {
    startNotificationScheduler();
    startReservationScheduler();
    const server = app.listen(port, () =>
      console.log(JSON.stringify({ event: "server_started", port })),
    );
    const shutdown = (signal) => {
      console.log(JSON.stringify({ event: "shutdown", signal }));
      server.close(() => db.close(() => process.exit(0)));
      setTimeout(() => process.exit(1), 5000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
