import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import aircraftRoutes from './routes/aircrafts';
import componentRoutes from './routes/components';
import serviceRoutes from './routes/services';

dotenv.config();

const app = express();
import prisma from './lib/prisma';

app.use(cors({
    origin: true, // dynamic allow all
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));

app.options('*', cors());
app.use(express.json());

// Serve uploaded files (certificates, etc.)
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/aircrafts', aircraftRoutes);
app.use('/api/components', componentRoutes);
import aircraftComponentRoutes from './routes/aircraft_components';
import forecastRoutes from './routes/forecast';
import schedulerRoutes from './routes/scheduler';
import journeyLogRoutes from './routes/journey_logs';
import inventoryRoutes from './routes/inventory';
import dmiRoutes from './routes/dmi';

app.use('/api/services', serviceRoutes);
app.use('/api/aircraft_components', aircraftComponentRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/journey_logs', journeyLogRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dmi', dmiRoutes);

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}

export default app;
export { prisma };
