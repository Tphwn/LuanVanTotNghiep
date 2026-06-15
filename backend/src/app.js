const express = require("express");
const cors = require("cors");
const path = require("path");

const { errorHandler } = require("./middlewares/errorHandler");
const { notFound } = require("./middlewares/notFound");
const authMiddleware = require("./middlewares/auth.middleware");
const adminMiddleware = require("./middlewares/adminMiddleware");

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

/* =========================
   AUTH ROUTES
========================= */
app.use("/api/auth", require("./modules/auth/auth.routes"));

/* =========================
   ADMIN ROUTES (Đã được bảo vệ nghiêm ngặt)
========================= */
app.use("/api/admin/users", authMiddleware, adminMiddleware, require("./modules/admin/user/adminUser.routes"));
app.use("/api/admin/hotels", authMiddleware, adminMiddleware, require("./modules/admin/hotel/hotel.routes"));
app.use("/api/admin/room-types", authMiddleware, adminMiddleware, require("./modules/admin/roomType/adminRoomType.routes"));
app.use("/api/admin/reviews", authMiddleware, adminMiddleware, require("./modules/admin/review/adminReview.routes"));
app.use("/api/admin/reports", authMiddleware, adminMiddleware, require("./modules/admin/report/adminReport.routes"));
app.use("/api/admin/bookings", authMiddleware, adminMiddleware, require("./modules/admin/booking/adminBooking.routes"));
app.use("/api/admin/payments", authMiddleware, adminMiddleware, require("./modules/admin/payment/adminPayment.routes"));
app.use("/api/admin/finance", authMiddleware, adminMiddleware, require("./modules/admin/finance/finance.routes"));

/* =========================
   PARTNER ROUTES
========================= */
app.use("/api/partner/rooms", authMiddleware, require("./modules/roomType/roomType.routes"));
app.use("/api/partner/hotels", require("./modules/hotel/hotel.routes")); // Thêm authMiddleware nếu cần
app.use("/api/partner/bookings", require("./modules/booking/booking.routes")); // Thêm authMiddleware nếu cần
app.use("/api/partner/pricing", require("./modules/pricing/pricing.routes")); // Thêm authMiddleware nếu cần
app.use("/api/partner/inventory", require("./modules/inventory/inventory.routes"));
app.use("/api/partner/reviews", require("./modules/review/partnerReview.routes"));
app.use("/api/partner/account", require("./modules/account/partnerAccount.routes"));
app.use("/api/partner/finance", require("./modules/finance/finance.routes")); // Thêm authMiddleware nếu cần
app.use("/api/partner/notifications", require("./modules/notification/partnerNotification.routes"));

/* =========================
   AMENITY ROUTES
========================= */
app.use("/api/amenities/requests", require("./modules/amenity/amenityRequest.routes"));
app.use("/api/amenities", require("./modules/amenity/amenity.routes"));

/* =========================
   404 + ERROR HANDLER
========================= */
app.use(notFound);
app.use(errorHandler);

module.exports = app;