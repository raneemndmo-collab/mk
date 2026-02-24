import { Router } from "express";
import { TicketService } from "../services/ticket-service.js";
import { ticketCreateSchema, ticketStatusUpdateSchema, ticketAssignSchema } from "@mk/shared";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const ticketService = new TicketService();

/** GET /tickets — List tickets (ops roles). */
router.get("/", requireAuth, requireRole("ADMIN", "OPS_MANAGER", "CLEANER", "TECHNICIAN"), async (req, res) => {
  try {
    const result = await ticketService.list({
      status: req.query.status as any,
      type: req.query.type as any,
      unitId: req.query.unitId as string,
      assignedToUserId: req.query.assignedToUserId as string,
      zone: req.query.zone as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to list tickets" });
  }
});

/** GET /tickets/stats — Dashboard stats. */
router.get("/stats", requireAuth, requireRole("ADMIN", "OPS_MANAGER"), async (_req, res) => {
  try {
    const stats = await ticketService.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to get stats" });
  }
});

/** GET /tickets/:id — Ticket detail with tasks. */
router.get("/:id", requireAuth, requireRole("ADMIN", "OPS_MANAGER", "CLEANER", "TECHNICIAN"), async (req, res) => {
  try {
    const ticket = await ticketService.getById(req.params.id);
    res.json(ticket);
  } catch (err) {
    res.status(404).json({ code: "NOT_FOUND", message: "Ticket not found" });
  }
});

/** POST /tickets — Create ticket. */
router.post("/", requireAuth, requireRole("ADMIN", "OPS_MANAGER"), async (req, res) => {
  try {
    const parsed = ticketCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "VALIDATION", message: parsed.error.message });
    }
    const ticket = await ticketService.create(parsed.data);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to create ticket" });
  }
});

/** PATCH /tickets/:id/status — Update ticket status. */
router.patch("/:id/status", requireAuth, requireRole("ADMIN", "OPS_MANAGER", "CLEANER", "TECHNICIAN"), async (req, res) => {
  try {
    const parsed = ticketStatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "VALIDATION", message: parsed.error.message });
    }
    const ticket = await ticketService.updateStatus(req.params.id, parsed.data.status, parsed.data.notes);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to update ticket" });
  }
});

/** PATCH /tickets/:id/assign — Assign ticket. */
router.patch("/:id/assign", requireAuth, requireRole("ADMIN", "OPS_MANAGER"), async (req, res) => {
  try {
    const parsed = ticketAssignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "VALIDATION", message: parsed.error.message });
    }
    const ticket = await ticketService.assign(req.params.id, parsed.data.assignedToUserId);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to assign ticket" });
  }
});

/** POST /tickets/:id/tasks — Add task to ticket. */
router.post("/:id/tasks", requireAuth, requireRole("ADMIN", "OPS_MANAGER"), async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ code: "BAD_REQUEST", message: "Title required" });
    const task = await ticketService.addTask(req.params.id, title);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to add task" });
  }
});

/** PATCH /tickets/tasks/:taskId/complete — Complete a task. */
router.patch("/tasks/:taskId/complete", requireAuth, requireRole("ADMIN", "OPS_MANAGER", "CLEANER", "TECHNICIAN"), async (req, res) => {
  try {
    const task = await ticketService.completeTask(req.params.taskId, req.body.photoUrls);
    res.json(task);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to complete task" });
  }
});

export default router;
