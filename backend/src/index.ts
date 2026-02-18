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
    origin: true, // dynamic allow all
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.options('*', cors());
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

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}

export default app;
export { prisma };
