import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import { tickets, ticketTasks } from "../db/schema.js";
import { logger } from "../lib/logger.js";
import type { TicketType, TicketStatus, TicketPriority } from "@mk/shared";

export class TicketService {
  async create(params: {
    type: TicketType;
    unitId: string;
    bookingId?: string;
    title: string;
    description?: string;
    dueAt?: string;
    priority?: TicketPriority;
    assignedToUserId?: string;
    zone?: string;
    notes?: string;
  }) {
    const [ticket] = await db.insert(tickets).values({
      type: params.type,
      unitId: params.unitId,
      bookingId: params.bookingId ?? null,
      title: params.title,
      description: params.description ?? "",
      dueAt: params.dueAt ? new Date(params.dueAt) : null,
      priority: params.priority ?? "MEDIUM",
      assignedToUserId: params.assignedToUserId ?? null,
      zone: params.zone ?? null,
      notes: params.notes ?? null,
    }).returning();

    logger.info({ ticketId: ticket.id, type: params.type }, "Ticket created");
    return ticket;
  }

  async getById(id: string) {
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
    });
    if (!ticket) throw new Error("Ticket not found");

    const tasks = await db.query.ticketTasks.findMany({
      where: eq(ticketTasks.ticketId, id),
    });

    return { ...ticket, tasks };
  }

  async list(filters?: {
    status?: TicketStatus;
    type?: TicketType;
    unitId?: string;
    assignedToUserId?: string;
    zone?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters?.status) conditions.push(eq(tickets.status, filters.status));
    if (filters?.type) conditions.push(eq(tickets.type, filters.type));
    if (filters?.unitId) conditions.push(eq(tickets.unitId, filters.unitId));
    if (filters?.assignedToUserId) conditions.push(eq(tickets.assignedToUserId, filters.assignedToUserId));
    if (filters?.zone) conditions.push(eq(tickets.zone, filters.zone));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.query.tickets.findMany({
        where,
        orderBy: [desc(tickets.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(tickets).where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: TicketStatus, notes?: string) {
    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (notes) updates.notes = notes;
    if (status === "COMPLETED") updates.completedAt = new Date();

    const [updated] = await db.update(tickets)
      .set(updates)
      .where(eq(tickets.id, id))
      .returning();

    logger.info({ ticketId: id, status }, "Ticket status updated");
    return updated;
  }

  async assign(id: string, userId: string) {
    const [updated] = await db.update(tickets)
      .set({
        assignedToUserId: userId,
        status: "ASSIGNED",
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();

    logger.info({ ticketId: id, userId }, "Ticket assigned");
    return updated;
  }

  async addTask(ticketId: string, title: string) {
    const [task] = await db.insert(ticketTasks).values({
      ticketId,
      title,
    }).returning();
    return task;
  }

  async completeTask(taskId: string, photoUrls?: string[]) {
    const [task] = await db.update(ticketTasks)
      .set({
        done: true,
        photoUrls: photoUrls ?? [],
        completedAt: new Date(),
      })
      .where(eq(ticketTasks.id, taskId))
      .returning();
    return task;
  }

  /** Get stats for dashboard. */
  async getStats() {
    const result = await db.select({
      status: tickets.status,
      count: sql<number>`count(*)`,
    })
      .from(tickets)
      .groupBy(tickets.status);

    const stats: Record<string, number> = {};
    for (const row of result) {
      stats[row.status] = Number(row.count);
    }
    return stats;
  }
}
