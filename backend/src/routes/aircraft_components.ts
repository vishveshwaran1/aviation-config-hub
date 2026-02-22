import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
import prisma from '../lib/prisma';

// Get components for an aircraft
router.get('/:aircraftId', async (req, res) => {
    try {
        const components = await prisma.aircraftComponent.findMany({
            where: { aircraft_id: req.params.aircraftId }
        });
        res.json(components);
    } catch (error) {
        console.error("Error fetching aircraft components:", error);
        res.status(500).json({ error: 'Failed to fetch aircraft components', details: (error as Error).message });
    }
});

// Create aircraft components (supports single or bulk insert)
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        // Check if array (bulk insert)
        if (Array.isArray(body)) {
            // Prisma createMany
            const result = await prisma.aircraftComponent.createMany({
                data: body.map(item => ({
                    aircraft_id: item.aircraft_id,
                    section: item.section,
                    manufacturer: item.manufacturer,
                    model: item.model,
                    serial_number: item.serial_number,
                    part_number: item.part_number,
                    status: item.status,
                    manufacture_date: (item.manufacture_date && item.manufacture_date.trim() !== "") ? new Date(item.manufacture_date) : null,
                    // handle dates and numbers
                    last_shop_visit_date: (item.last_shop_visit_date && item.last_shop_visit_date.trim() !== "") ? new Date(item.last_shop_visit_date) : null,
                    hours_since_new: item.hours_since_new ? Number(item.hours_since_new) : 0,
                    cycles_since_new: item.cycles_since_new ? Number(item.cycles_since_new) : 0,
                }))
            });
            res.json(result);
        } else {
            // Single insert
            const result = await prisma.aircraftComponent.create({
                data: {
                    aircraft_id: body.aircraft_id,
                    section: body.section,
                    manufacturer: body.manufacturer,
                    model: body.model,
                    serial_number: body.serial_number,
                    part_number: body.part_number,
                    status: body.status,
                    manufacture_date: (body.manufacture_date && body.manufacture_date.trim() !== "") ? new Date(body.manufacture_date) : null,
                    last_shop_visit_date: (body.last_shop_visit_date && body.last_shop_visit_date.trim() !== "") ? new Date(body.last_shop_visit_date) : null,
                    hours_since_new: body.hours_since_new ? Number(body.hours_since_new) : 0,
                    cycles_since_new: body.cycles_since_new ? Number(body.cycles_since_new) : 0,
                }
            });
            res.json(result);
        }
    } catch (error) {
        console.error(error);
        console.error("Error creating aircraft components:", error);
        res.status(500).json({ error: 'Failed to create aircraft components', details: (error as Error).message });
    }
});

// Update a single aircraft component
router.patch('/:componentId', async (req, res) => {
    try {
        const { componentId } = req.params;
        const body = req.body;
        const result = await prisma.aircraftComponent.update({
            where: { id: componentId },
            data: {
                section: body.section,
                manufacturer: body.manufacturer,
                model: body.model,
                serial_number: body.serial_number,
                part_number: body.part_number,
                status: body.status,
                manufacture_date: (body.manufacture_date && body.manufacture_date.trim() !== "") ? new Date(body.manufacture_date) : undefined,
                last_shop_visit_date: (body.last_shop_visit_date && body.last_shop_visit_date.trim() !== "") ? new Date(body.last_shop_visit_date) : null,
                hours_since_new: body.hours_since_new !== undefined ? Number(body.hours_since_new) : undefined,
                cycles_since_new: body.cycles_since_new !== undefined ? Number(body.cycles_since_new) : undefined,
            }
        });
        console.log("Updated aircraft component:", result);
        res.json(result);
    } catch (error) {
        console.error("Error updating aircraft component:", error);
        res.status(500).json({ error: 'Failed to update aircraft component', details: (error as Error).message });
    }
});

// Delete a single aircraft component
router.delete('/:componentId', async (req, res) => {
    try {
        const { componentId } = req.params;
        await prisma.aircraftComponent.delete({ where: { id: componentId } });
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting aircraft component:", error);
        res.status(500).json({ error: 'Failed to delete aircraft component', details: (error as Error).message });
    }
});

export default router;
