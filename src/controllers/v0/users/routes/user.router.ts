import { Router, Request, Response } from 'express';

import { User } from '../models/User';
import { AuthRouter, requireAuth } from './auth.router';

const router: Router = Router();

//Root Endpoint for Authentification
router.use('/auth', AuthRouter);

//Get all users
router.get('/', requireAuth, async (req: Request, res: Response) => {
    const users = await User.findAndCountAll({ order: [['email', 'DESC']] });
    res.status(200).send(users);
});

export const UserRouter: Router = router;