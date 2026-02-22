import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
import prisma from '../lib/prisma';

router.get('/', async (req, res) => {
    try {
        const services = await prisma.service.findMany();
        res.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ error: 'Failed to fetch services', details: (error as Error).message });
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            aircraft_model,
            task_name,
            mpd_amm_task_ids,
            task_card_ref,
            description,
            assigned_component_id,
            zones,
            estimated_manhours,
            estimated_price,
            quotation_price,
            interval_threshold,
            repeat_interval,
            interval_unit,
        } = req.body;

        const service = await prisma.service.create({
            data: {
                aircraft_model,
                task_name,
                mpd_amm_task_ids,
                task_card_ref,
                description,
                assigned_component_id,
                zones: zones || [],
                estimated_manhours: estimated_manhours ? Number(estimated_manhours) : null,
                estimated_price: estimated_price ? Number(estimated_price) : null,
                quotation_price: quotation_price ? Number(quotation_price) : null,
                interval_threshold: interval_threshold ? Number(interval_threshold) : null,
                repeat_interval: repeat_interval ? Number(repeat_interval) : null,
                interval_unit: interval_unit ?? 'Hours',
            }
        });
        res.json(service);
    } catch (error) {
        console.error(error);
        console.error("Error creating service:", error);
        res.status(500).json({ error: 'Failed to create service', details: (error as Error).message });
    }
});

// Delete service
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.service.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Service not found' });
        await prisma.service.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({ error: 'Failed to delete service', details: (error as Error).message });
    }
});

export default router;
