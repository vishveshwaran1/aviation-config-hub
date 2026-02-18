import express from 'express';
import cors from 'cors';
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
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://aviation-config-hub.vercel.app',
        'https://aviation-config-hub-9y2x.vercel.app',
        'https://aviation-config-hub-9y2x-kkv3w4db9-vishveshwaran-as-projects.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/aircrafts', aircraftRoutes);
app.use('/api/components', componentRoutes);
import aircraftComponentRoutes from './routes/aircraft_components';

// ... other imports

app.use('/api/services', serviceRoutes);
app.use('/api/aircraft_components', aircraftComponentRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});

export { prisma };
