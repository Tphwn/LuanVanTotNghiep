const express = require("express");
const cors = require("cors");
const path = require("path");

const { errorHandler } = require("./middlewares/errorHandler");
const { notFound } = require("./middlewares/notFound");

const authMiddleware = require("./middlewares/auth.middleware");
const adminMiddleware = require("./middlewares/adminMiddleware");
const adminHotelRoutes = require('./modules/admin/hotel/hotel.routes');
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

app.use(
  "/api/auth",
  require("./modules/auth/auth.routes")
);

/* =========================
   ADMIN ROUTES
========================= */

app.use(
  "/api/admin/users",
  authMiddleware,
  adminMiddleware,
  require("./modules/admin/user/adminUser.routes")
);
app.use('/api/admin/hotels', authMiddleware, adminMiddleware, adminHotelRoutes);
app.use('/api/partner/rooms', authMiddleware, require('./modules/roomType/roomType.routes'));
app.use('/api/admin/bookings', require('./modules/admin/booking/adminBooking.routes'));
app.use('/api/admin/payments', require('./modules/admin/payment/adminPayment.routes'));
/* =========================
   AMENITY ROUTES
========================= */

app.use('/api/amenities/requests', require('./modules/amenity/amenityRequest.routes'));
app.use(
  "/api/amenities",
  require("./modules/amenity/amenity.routes")
);
app.use('/api/partner/hotels', require('./modules/hotel/hotel.routes'));
app.use('/api/partner/bookings', require('./modules/booking/booking.routes'));
app.use('/api/partner/pricing', require('./modules/pricing/pricing.routes'));
app.use(
  '/api/partner/finance',
  require('./modules/finance/finance.routes')
);
/* =========================
   404 + ERROR HANDLER
========================= */

app.use(notFound);
app.use(errorHandler);

module.exports = app;