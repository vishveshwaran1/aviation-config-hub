import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
import prisma from '../lib/prisma';

// Get all components (catalogue)
router.get('/', async (req, res) => {
    try {
        const components = await prisma.component.findMany();
        res.json(components);
    } catch (error) {
        console.error("Error fetching components:", error);
        res.status(500).json({ error: 'Failed to fetch components', details: (error as Error).message });
    }
});

// Create component (catalogue)
router.post('/', async (req, res) => {
    try {
        const {
            manufacturer, name, part_number, cmm_number, classification,
            classification_date, class_linkage, compatible_aircraft_models,
            estimated_price, quotation_price
        } = req.body;

        const component = await prisma.component.create({
            data: {
                manufacturer,
                name,
                part_number,
                cmm_number,
                classification,
                classification_date: classification_date ? new Date(classification_date) : null,
                class_linkage,
                compatible_aircraft_models: compatible_aircraft_models || [],
                estimated_price: estimated_price ? Number(estimated_price) : null,
                quotation_price: quotation_price ? Number(quotation_price) : null,
            }
        });

        res.json(component);
    } catch (error) {
        console.error("Error creating component:", error);
        res.status(500).json({ error: 'Failed to create component', details: (error as Error).message });
    }
});

// Delete component
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.component.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Component not found' });
        await prisma.component.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting component:", error);
        res.status(500).json({ error: 'Failed to delete component', details: (error as Error).message });
    }
});

// Update component
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            manufacturer, name, part_number, cmm_number, classification,
            classification_date, class_linkage, compatible_aircraft_models,
            estimated_price, quotation_price
        } = req.body;

        const component = await prisma.component.update({
            where: { id },
            data: {
                manufacturer,
                name,
                part_number,
                cmm_number,
                classification,
                classification_date: classification_date ? new Date(classification_date) : undefined,
                class_linkage,
                compatible_aircraft_models: compatible_aircraft_models || undefined,
                estimated_price: estimated_price !== undefined ? Number(estimated_price) : undefined,
                quotation_price: quotation_price !== undefined ? Number(quotation_price) : undefined,
            }
        });

        res.json(component);
    } catch (error) {
        console.error("Error updating component:", error);
        res.status(500).json({ error: 'Failed to update component', details: (error as Error).message });
    }
});

export default router;
