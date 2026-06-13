import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all DMIs (for Supply Chain / Requisition & Sourcing) for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    // Get all aircraft IDs for this user
    const userAircrafts = await prisma.aircraft.findMany({
      where: { user_id: userId },
      select: { id: true }
    });
    
    const aircraftIds = userAircrafts.map(a => a.id);

    const dmis = await prisma.dMI.findMany({
      where: {
        aircraft_id: { in: aircraftIds }
      },
      include: {
        defect: {
          include: {
            journey_log: true
          }
        }
      },
      orderBy: { created_at: "desc" },
    });
    res.json(dmis);
  } catch (error) {
    console.error("Error fetching all DMIs:", error);
    res.status(500).json({ error: "Failed to fetch DMIs" });
  }
});

// Get all DMIs for an aircraft
router.get("/aircraft/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const userId = (req as any).user.userId;

    // Verify the aircraft belongs to the user
    const aircraft = await prisma.aircraft.findFirst({
      where: { id: id, user_id: userId }
    });

    if (!aircraft) {
      return res.status(403).json({ error: "Unauthorized access to this aircraft's DMIs" });
    }

    const dmis = await prisma.dMI.findMany({
      where: { aircraft_id: id },
      include: {
        defect: {
          include: {
            journey_log: true
          }
        }
      },
      orderBy: { created_at: "desc" },
    });
    res.json(dmis);
  } catch (error) {
    console.error("Error fetching DMIs:", error);
    res.status(500).json({ error: "Failed to fetch DMIs" });
  }
});

// Update DMI status
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.dMI.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update DMI" });
  }
});

export default router;
