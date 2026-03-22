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
                data: body.map(({ id: _omit, ...item }: any) => ({
                    aircraft_id: item.aircraft_id,
                    ata: item.ata ?? null,
                    section: item.section ?? "",
                    manufacturer: item.manufacturer,
                    model: item.model,
                    serial_number: item.serial_number,
                    part_number: item.part_number,
                    status: item.status,
                    manufacture_date: (typeof item.manufacture_date === 'string' && item.manufacture_date.trim() !== "") ? new Date(item.manufacture_date) : null,
                    // handle dates and numbers
                    last_shop_visit_date: (typeof item.last_shop_visit_date === 'string' && item.last_shop_visit_date.trim() !== "") ? new Date(item.last_shop_visit_date) : null,
                    time_since_visit: item.time_since_visit !== undefined && item.time_since_visit !== null ? Number(item.time_since_visit) : null,
                    cycle_since_visit: item.cycle_since_visit !== undefined && item.cycle_since_visit !== null ? Number(item.cycle_since_visit) : null,
                    hours_since_new: item.hours_since_new !== undefined && item.hours_since_new !== null ? Number(item.hours_since_new) : 0,
                    cycles_since_new: item.cycles_since_new !== undefined && item.cycles_since_new !== null ? Number(item.cycles_since_new) : 0,
                    tsi: item.tsi !== undefined && item.tsi !== null ? Number(item.tsi) : null,
                    csi: item.csi !== undefined && item.csi !== null ? Number(item.csi) : null,
                } as any))
            });
            res.json(result);
        } else {
            // Single insert
            const result = await prisma.aircraftComponent.create({
                data: {
                    aircraft_id: body.aircraft_id,
                    ata: body.ata ?? null,
                    section: body.section,
                    manufacturer: body.manufacturer,
                    model: body.model,
                    serial_number: body.serial_number,
                    part_number: body.part_number,
                    status: body.status,
                    manufacture_date: (typeof body.manufacture_date === 'string' && body.manufacture_date.trim() !== "") ? new Date(body.manufacture_date) : null,
                    last_shop_visit_date: (typeof body.last_shop_visit_date === 'string' && body.last_shop_visit_date.trim() !== "") ? new Date(body.last_shop_visit_date) : null,
                    time_since_visit: body.time_since_visit !== undefined && body.time_since_visit !== null ? Number(body.time_since_visit) : null,
                    cycle_since_visit: body.cycle_since_visit !== undefined && body.cycle_since_visit !== null ? Number(body.cycle_since_visit) : null,
                    hours_since_new: body.hours_since_new !== undefined && body.hours_since_new !== null ? Number(body.hours_since_new) : 0,
                    cycles_since_new: body.cycles_since_new !== undefined && body.cycles_since_new !== null ? Number(body.cycles_since_new) : 0,
                    tsi: body.tsi !== undefined && body.tsi !== null ? Number(body.tsi) : null,
                    csi: body.csi !== undefined && body.csi !== null ? Number(body.csi) : null,
                } as any
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
                ata: body.ata !== undefined ? body.ata : undefined,
                section: body.section,
                manufacturer: body.manufacturer,
                model: body.model,
                serial_number: body.serial_number,
                part_number: body.part_number,
                status: body.status,
                manufacture_date: (typeof body.manufacture_date === 'string' && body.manufacture_date.trim() !== "") ? new Date(body.manufacture_date) : undefined,
                last_shop_visit_date: (typeof body.last_shop_visit_date === 'string' && body.last_shop_visit_date.trim() !== "") ? new Date(body.last_shop_visit_date) : undefined,
                time_since_visit: body.time_since_visit !== undefined && body.time_since_visit !== null ? Number(body.time_since_visit) : undefined,
                cycle_since_visit: body.cycle_since_visit !== undefined && body.cycle_since_visit !== null ? Number(body.cycle_since_visit) : undefined,
                hours_since_new: body.hours_since_new !== undefined && body.hours_since_new !== null ? Number(body.hours_since_new) : undefined,
                cycles_since_new: body.cycles_since_new !== undefined && body.cycles_since_new !== null ? Number(body.cycles_since_new) : undefined,
                tsi: body.tsi !== undefined && body.tsi !== null ? Number(body.tsi) : undefined,
                csi: body.csi !== undefined && body.csi !== null ? Number(body.csi) : undefined,
            } as any
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
