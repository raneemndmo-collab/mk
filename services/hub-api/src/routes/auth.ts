import { Router } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/connection.js";
import { users } from "../db/schema.js";
import { config } from "../config.js";
import type { AuthPayload } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "Email and password required" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid credentials" });
    }

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        zones: user.zones,
      },
    });
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Login failed" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "Name, email, and password required" });
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      return res.status(409).json({ code: "CONFLICT", message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      name,
      email,
      phone: phone ?? "",
      passwordHash,
      role: "TENANT",
    }).returning();

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Registration failed" });
  }
});

export default router;
