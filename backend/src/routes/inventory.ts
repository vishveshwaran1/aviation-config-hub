import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Get all inventory items
router.get("/", async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: { created_at: "desc" },
    });
    res.json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Check stock by part number
router.get("/check/:partNumber", async (req, res) => {
  const { partNumber } = req.params;
  try {
    const item = await prisma.inventory.findFirst({
      where: {
        OR: [
          { part_number: partNumber },
          { sn_or_batch: partNumber },
          { interchangeable: partNumber },
        ],
      },
    });
    if (!item) {
      return res.json({ inStock: false, available: 0 });
    }
    res.json({ inStock: item.available > 0, available: item.available, item });
  } catch (error) {
    console.error("Error checking inventory:", error);
    res.status(500).json({ error: "Failed to check inventory" });
  }
});

// Update inventory
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.inventory.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

// Create inventory
router.post("/", async (req, res) => {
  try {
    const newItem = await prisma.inventory.create({
      data: req.body,
    });
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

// Delete inventory
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.inventory.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
});

export default router;
