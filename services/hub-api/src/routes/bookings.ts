import { Router } from "express";
import { BookingService, ServiceError } from "../services/booking-service.js";
import { quoteParamsSchema, bookingCreateSchema } from "@mk/shared";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();
const bookingService = new BookingService();

/** POST /bookings/quote — Public quote (no login). */
router.post("/quote", optionalAuth, async (req, res) => {
  try {
    const parsed = quoteParamsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "VALIDATION", message: parsed.error.message });
    }
    const quote = await bookingService.quote(parsed.data);
    res.json(quote);
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ code: "SERVICE_ERROR", message: err.message });
    }
    res.status(500).json({ code: "INTERNAL", message: "Quote failed" });
  }
});

/** POST /bookings — Requires login. */
router.post("/", requireAuth, async (req, res) => {
  try {
    const parsed = bookingCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "VALIDATION", message: parsed.error.message });
    }
    const booking = await bookingService.create(parsed.data);
    res.status(201).json(booking);
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ code: "SERVICE_ERROR", message: err.message });
    }
    res.status(500).json({ code: "INTERNAL", message: "Booking creation failed" });
  }
});

export default router;
