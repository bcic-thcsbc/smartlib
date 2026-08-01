const express = require("express");
const multer = require("multer");
const asyncHandler = require("../utils/asyncHandler");
const { requireLogin, requireAdmin } = require("../middlewares/auth");
const auth = require("../controllers/authController");
const dashboard = require("../controllers/dashboardController");
const users = require("../controllers/usersController");
const books = require("../controllers/booksController");
const copies = require("../controllers/copiesController");
const borrow = require("../controllers/borrowController");
const profile = require("../controllers/profileController");
const operations = require("../controllers/operationsController");
const workflow = require("../controllers/workflowController");
const reservations = require("../controllers/reservationController");
const library = require("../controllers/libraryController");
const spreadsheets = require("../controllers/importExportController");
const uploads = require("../controllers/uploadsController");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, done) =>
    done(
      null,
      [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(file.mimetype),
    ),
});

router.post("/auth/login", asyncHandler(auth.login));
router.post("/auth/register", asyncHandler(auth.register));
router.post("/auth/logout", auth.logout);
router.get("/auth/me", auth.me);
router.get("/reference/departments", asyncHandler(operations.departments));
router.get("/dashboard", requireAdmin, asyncHandler(dashboard.summary));
router.get("/search", requireLogin, asyncHandler(library.globalSearch));
router.get("/users", requireAdmin, asyncHandler(users.list));
router.put("/users/:id", requireAdmin, asyncHandler(users.update));
router.delete("/users/:id", requireAdmin, asyncHandler(users.remove));
router.get("/books", requireLogin, asyncHandler(books.list));
router.get(
  "/books/:id/availability",
  requireLogin,
  asyncHandler(reservations.availability),
);
router.get(
  "/books/:id/admin-detail",
  requireAdmin,
  asyncHandler(library.bookAdminDetail),
);
router.get("/books/:id", requireLogin, asyncHandler(books.detail));
router.post("/books", requireAdmin, asyncHandler(books.create));
router.put("/books/:id", requireAdmin, asyncHandler(books.update));
router.delete("/books", requireAdmin, asyncHandler(books.removeMany));
router.delete("/books/:id", requireAdmin, asyncHandler(books.remove));
router.get("/book-copies", requireLogin, asyncHandler(copies.list));
router.get("/book-copies/:id", requireAdmin, asyncHandler(library.copyDetail));
router.post("/book-copies", requireAdmin, asyncHandler(copies.create));
router.put("/book-copies/:id", requireAdmin, asyncHandler(copies.update));
router.delete("/book-copies", requireAdmin, asyncHandler(copies.removeMany));
router.delete("/book-copies/:id", requireAdmin, asyncHandler(copies.remove));
router.get("/borrow", requireLogin, asyncHandler(borrow.list));
router.get("/borrow/:id", requireLogin, asyncHandler(borrow.detail));
router.post("/borrow", requireAdmin, asyncHandler(borrow.create));
router.post(
  "/borrow/:id/return",
  requireAdmin,
  asyncHandler(borrow.returnBorrow),
);
router.post("/borrow/:id/renew", requireLogin, asyncHandler(borrow.renew));
router.post(
  "/borrow/:id/items/:itemId/return",
  requireAdmin,
  asyncHandler(borrow.returnItem),
);
router.post(
  "/borrow/:id/items/:itemId/mark-lost",
  requireAdmin,
  asyncHandler(borrow.markLost),
);
router.post(
  "/borrow/:id/items/:itemId/mark-damaged",
  requireAdmin,
  asyncHandler(borrow.markDamaged),
);
router.get("/borrow-requests", requireLogin, asyncHandler(borrow.requestList));
router.post(
  "/borrow-requests",
  requireLogin,
  asyncHandler(reservations.createRequest),
);
router.post(
  "/borrow-requests/:id/approve",
  requireAdmin,
  asyncHandler(reservations.approve),
);
router.post(
  "/borrow-requests/:id/reject",
  requireAdmin,
  asyncHandler(borrow.rejectRequest),
);
router.post(
  "/borrow-requests/:id/cancel",
  requireLogin,
  asyncHandler(borrow.cancelRequest),
);
router.post(
  "/borrow-requests/:id/checkout",
  requireAdmin,
  asyncHandler(reservations.checkout),
);
router.get("/reservations", requireAdmin, asyncHandler(reservations.list));
router.get(
  "/notifications",
  requireLogin,
  asyncHandler(operations.notifications),
);
router.post(
  "/notifications/:id/read",
  requireLogin,
  asyncHandler(operations.readNotification),
);
router.post(
  "/notifications/read-all",
  requireLogin,
  asyncHandler(operations.readAllNotifications),
);
router.get(
  "/reports/circulation",
  requireAdmin,
  asyncHandler(operations.reports),
);
router.get("/incidents", requireAdmin, asyncHandler(workflow.incidentList));
router.post(
  "/incidents/:id/resolve",
  requireAdmin,
  asyncHandler(workflow.resolveIncident),
);
router.get(
  "/settings/circulation",
  requireAdmin,
  asyncHandler(operations.settings),
);
router.put(
  "/settings/circulation",
  requireAdmin,
  asyncHandler(operations.updateSettings),
);
router.put("/settings/departments", requireAdmin, asyncHandler(operations.updateDepartments));
router.get(
  "/settings/school",
  requireAdmin,
  asyncHandler(operations.schoolSettings),
);
router.put(
  "/settings/school",
  requireAdmin,
  asyncHandler(operations.updateSchoolSettings),
);
router.get(
  "/spreadsheets/books/template",
  requireAdmin,
  asyncHandler(spreadsheets.template),
);
router.post(
  "/spreadsheets/books/validate",
  requireAdmin,
  upload.single("file"),
  asyncHandler(spreadsheets.validate),
);
router.post(
  "/spreadsheets/books/commit",
  requireAdmin,
  upload.single("file"),
  asyncHandler(spreadsheets.commit),
);
router.get(
  "/spreadsheets/reports/export",
  requireAdmin,
  asyncHandler(spreadsheets.exportSheet),
);
router.post(
  "/uploads/covers",
  requireAdmin,
  upload.single("file"),
  asyncHandler(uploads.uploadCover),
);
router.get("/profile", requireLogin, asyncHandler(profile.getProfile));
router.put("/profile", requireLogin, asyncHandler(profile.updateProfile));
router.put(
  "/profile/password",
  requireLogin,
  asyncHandler(profile.changePassword),
);
module.exports = router;
