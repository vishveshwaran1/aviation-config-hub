import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/:aircraftId', async (req, res) => {
    try {
        const { aircraftId } = req.params;
        const records = await prisma.forecast.findMany({
            where: { aircraft_id: aircraftId },
        });
        res.json(records);
    } catch (error) {
        console.error('Error fetching forecast:', error);
        res.status(500).json({ error: 'Failed to fetch forecast', details: (error as Error).message });
    }
});


router.post('/', async (req, res) => {
    try {
        const {
            aircraft_id,
            service_id,
            interval_unit,
            last_date,
            last_hours,
            last_cycles,
            next_date,
            next_hours,
            next_cycles,
            remaining_hours,
            remaining_cycles,
            avg_hours,
            avg_cycles,
            status,
        } = req.body;

        const data = {
            aircraft_id,
            service_id,
            interval_unit: interval_unit ?? 'Hours',
            last_date: last_date ? new Date(last_date) : null,
            last_hours: last_hours !== undefined && last_hours !== null ? Number(last_hours) : null,
            last_cycles: last_cycles !== undefined && last_cycles !== null ? Number(last_cycles) : null,
            next_date: next_date ? new Date(next_date) : null,
            next_hours: next_hours !== undefined && next_hours !== null ? Number(next_hours) : null,
            next_cycles: next_cycles !== undefined && next_cycles !== null ? Number(next_cycles) : null,
            remaining_hours: remaining_hours !== undefined && remaining_hours !== null ? Number(remaining_hours) : null,
            remaining_cycles: remaining_cycles !== undefined && remaining_cycles !== null ? Number(remaining_cycles) : null,
            avg_hours: avg_hours !== undefined && avg_hours !== null ? Number(avg_hours) : 10,
            avg_cycles: avg_cycles !== undefined && avg_cycles !== null ? Number(avg_cycles) : 2,
            status: status ?? 'active',
        };

        const record = await prisma.forecast.upsert({
            where: {
                aircraft_id_service_id: { aircraft_id, service_id },
            },
            update: data,
            create: data,
        });

        res.json(record);
    } catch (error) {
        console.error('Error saving forecast:', error);
        res.status(500).json({ error: 'Failed to save forecast', details: (error as Error).message });
    }
});


router.patch('/avg/:aircraftId', async (req, res) => {
    try {
        const { aircraftId } = req.params;
        const { avg_hours, avg_cycles, updates } = req.body;

        // Run all updates in a transaction
        const ops = (updates as { service_id: string; next_date: string }[]).map((u) =>
            prisma.forecast.updateMany({
                where: { aircraft_id: aircraftId, service_id: u.service_id },
                data: {
                    next_date: u.next_date ? new Date(u.next_date) : undefined,
                    avg_hours: avg_hours !== undefined ? Number(avg_hours) : undefined,
                    avg_cycles: avg_cycles !== undefined ? Number(avg_cycles) : undefined,
                },
            })
        );
        await prisma.$transaction(ops);

        const updated = await prisma.forecast.findMany({ where: { aircraft_id: aircraftId } });
        res.json(updated);
    } catch (error) {
        console.error('Error updating avg forecast:', error);
        res.status(500).json({ error: 'Failed to update avg forecast', details: (error as Error).message });
    }
});

export default router;
