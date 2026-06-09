import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();
import prisma from '../lib/prisma';

// ── Certificate upload setup ──
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'certificates');
// Ensure the directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        // Generate a safe unique filename: uuid + original extension
        const ext = path.extname(file.originalname);
        const safeName = `${crypto.randomUUID()}${ext}`;
        cb(null, safeName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} not allowed. Accepted: ${allowed.join(', ')}`));
        }
    },
});

// ── Get components for an aircraft ──
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

// ── Create aircraft components (supports single or bulk insert) ──
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
                    component_name: item.component_name ?? null,
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
                    component_name: body.component_name ?? null,
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

// ── Update a single aircraft component ──
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
                component_name: body.component_name !== undefined ? body.component_name : undefined,
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

// ── Upload certificate for a component ──
router.post('/upload-certificate/:componentId', upload.single('certificate'), async (req, res) => {
    try {
        const { componentId } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Check the component exists before updating
        const existing = await prisma.aircraftComponent.findUnique({ where: { id: componentId } });
        if (!existing) {
            // Clean up the uploaded file since component doesn't exist
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Component not found' });
        }

        // If there's an existing certificate, remove the old file
        if (existing.certificate_url) {
            const oldFilename = path.basename(existing.certificate_url);
            const oldPath = path.join(UPLOAD_DIR, oldFilename);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const certificateUrl = `/api/uploads/certificates/${req.file.filename}`;

        const updated = await prisma.aircraftComponent.update({
            where: { id: componentId },
            data: { certificate_url: certificateUrl } as any,
        });

        res.json(updated);
    } catch (error) {
        console.error("Error uploading certificate:", error);
        res.status(500).json({ error: 'Failed to upload certificate', details: (error as Error).message });
    }
});

// ── Delete certificate for a component ──
router.delete('/certificate/:componentId', async (req, res) => {
    try {
        const { componentId } = req.params;
        const existing = await prisma.aircraftComponent.findUnique({ where: { id: componentId } });
        if (!existing) {
            return res.status(404).json({ error: 'Component not found' });
        }
        if (!existing.certificate_url) {
            return res.status(400).json({ error: 'No certificate to delete' });
        }

        // Remove the file from disk
        const filename = path.basename(existing.certificate_url);
        const filePath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Null out the DB field
        const updated = await prisma.aircraftComponent.update({
            where: { id: componentId },
            data: { certificate_url: null } as any,
        });

        res.json(updated);
    } catch (error) {
        console.error("Error deleting certificate:", error);
        res.status(500).json({ error: 'Failed to delete certificate', details: (error as Error).message });
    }
});

// ── Delete a single aircraft component ──
router.delete('/:componentId', async (req, res) => {
    try {
        const { componentId } = req.params;
        // Clean up certificate file if it exists
        const existing = await prisma.aircraftComponent.findUnique({ where: { id: componentId } });
        if (existing?.certificate_url) {
            const filename = path.basename(existing.certificate_url);
            const filePath = path.join(UPLOAD_DIR, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await prisma.aircraftComponent.delete({ where: { id: componentId } });
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting aircraft component:", error);
        res.status(500).json({ error: 'Failed to delete aircraft component', details: (error as Error).message });
    }
});

export default router;
