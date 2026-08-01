const reservations = require("../controllers/reservationController");
const { expireRequests } = require("../controllers/borrowController");

let running = false;

async function processReservationLifecycle() {
  if (running) return;
  running = true;
  try {
    await reservations.advance();
    await expireRequests();
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "reservation_lifecycle_failed",
        message: error.message,
      }),
    );
  } finally {
    running = false;
  }
}

function startReservationScheduler() {
  void processReservationLifecycle();
  return setInterval(
    () => void processReservationLifecycle(),
    5 * 60 * 1000,
  ).unref();
}

module.exports = { processReservationLifecycle, startReservationScheduler };
