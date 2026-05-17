import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Get all DMIs for an aircraft
router.get("/aircraft/:id", async (req, res) => {
  const { id } = req.params;
  try {
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
router.put("/:id", async (req, res) => {
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
