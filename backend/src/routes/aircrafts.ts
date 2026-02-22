import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
import prisma from '../lib/prisma';

// Get all aircrafts for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const aircrafts = await prisma.aircraft.findMany({
            where: {
                user_id: userId
            },
            include: {
                components: true
            }
        });
        res.json(aircrafts);
    } catch (error) {
        console.error("Error fetching aircrafts:", error);
        console.error("Error fetching aircrafts:", error);
        res.status(500).json({ error: 'Failed to fetch aircrafts', details: (error as Error).message });
    }
});

// Get aircraft by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const aircraft = await prisma.aircraft.findFirst({
            where: {
                id: id,
                user_id: userId
            },
            include: {
                components: true
            }
        });

        if (!aircraft) {
            return res.status(404).json({ error: 'Aircraft not found' });
        }

        res.json(aircraft);
    } catch (error) {
        console.error("Error fetching aircraft:", error);
        res.status(500).json({ error: 'Failed to fetch aircraft', details: (error as Error).message });
    }
});
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            model, msn, registration_number, manufacture_date, delivery_date,
            flight_hours, flight_cycles, engines_count, status, country
        } = req.body;

        // Get user id from verified token
        const user_id = (req as any).user.userId;

        const aircraft = await prisma.aircraft.create({
            data: {
                model,
                msn,
                registration_number,
                manufacture_date: (manufacture_date && manufacture_date.trim() !== "") ? new Date(manufacture_date) : null,
                delivery_date: (delivery_date && delivery_date.trim() !== "") ? new Date(delivery_date) : null,
                flight_hours: Number(flight_hours),
                flight_cycles: Number(flight_cycles),
                engines_count: Number(engines_count),
                status,
                country,
                user_id
            }
        });
        res.json(aircraft);
    } catch (error) {
        console.error("Error creating aircraft:", error);
        res.status(500).json({ error: 'Failed to create aircraft', details: (error as Error).message });
    }
});

// Update aircraft
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            model, msn, registration_number, manufacture_date, delivery_date,
            flight_hours, flight_cycles, engines_count, status, country
        } = req.body;

        const userId = (req as any).user.userId;

        const aircraft = await prisma.aircraft.update({
            where: { id: id, user_id: userId },
            data: {
                model,
                msn,
                registration_number,
                manufacture_date: (manufacture_date && manufacture_date.trim() !== "") ? new Date(manufacture_date) : undefined,
                delivery_date: (delivery_date && delivery_date.trim() !== "") ? new Date(delivery_date) : undefined,
                flight_hours: flight_hours !== undefined ? Number(flight_hours) : undefined,
                flight_cycles: flight_cycles !== undefined ? Number(flight_cycles) : undefined,
                engines_count: engines_count !== undefined ? Number(engines_count) : undefined,
                status,
                country
            }
        });
        res.json(aircraft);
    } catch (error) {
        console.error("Error updating aircraft:", error);
        res.status(500).json({ error: 'Failed to update aircraft', details: (error as Error).message });
    }
});

// Delete aircraft
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        // Verify aircraft belongs to this user
        const existing = await prisma.aircraft.findFirst({
            where: { id, user_id: userId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Aircraft not found' });
        }

        // Delete related components first (FK cascade safety)
        await prisma.aircraftComponent.deleteMany({ where: { aircraft_id: id } });

        await prisma.aircraft.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting aircraft:", error);
        res.status(500).json({ error: 'Failed to delete aircraft', details: (error as Error).message });
    }
});

export default router;
