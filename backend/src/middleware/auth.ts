import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', async (err: any, decoded: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });

        try {
            // Verify user still exists in DB (important after DB resets)
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId }
            });

            if (!user) {
                return res.status(401).json({ error: 'User no longer exists' });
            }

            (req as any).user = decoded;
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error during auth' });
        }
    });
};
