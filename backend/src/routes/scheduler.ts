import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/scheduler/:aircraftId — list all scheduler entries for an aircraft
router.get('/:aircraftId', authenticateToken, async (req, res) => {
    try {
        const entries = await (prisma as any).scheduler.findMany({
            where: { aircraft_id: req.params.aircraftId },
            orderBy: { flight_date: 'asc' },
        });
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch scheduler entries.' });
    }
});

// POST /api/scheduler/:aircraftId — bulk create from uploaded Excel data
// Body: [{ flight_date: string, flight_hours: number, flight_cycles: number }, ...]
router.post('/:aircraftId', authenticateToken, async (req, res) => {
    try {
        const { aircraftId } = req.params;
        const rows: Array<{ flight_date: string; flight_hours: number; flight_cycles: number }> = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'Payload must be a non-empty array.' });
        }

        const created = await (prisma as any).scheduler.createMany({
            data: rows.map((r) => ({
                aircraft_id: aircraftId,
                flight_date: new Date(r.flight_date),
                flight_hours: parseFloat(String(r.flight_hours ?? 0)) || 0,
                flight_cycles: parseFloat(String(r.flight_cycles ?? 0)) || 0,
            })),
            skipDuplicates: true,
        });

        // Return the full list after insert
        const all = await (prisma as any).scheduler.findMany({
            where: { aircraft_id: aircraftId },
            orderBy: { flight_date: 'asc' },
        });
        res.json(all);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload scheduler data.' });
    }
});

// DELETE /api/scheduler/entry/:id — delete a single entry
router.delete('/entry/:id', authenticateToken, async (req, res) => {
    try {
        await (prisma as any).scheduler.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete entry.' });
    }
});

export default router;
