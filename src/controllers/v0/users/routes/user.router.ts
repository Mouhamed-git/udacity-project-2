import { Router, Request, Response } from 'express';

import { User } from '../models/User';
import { AuthRouter, requireAuth } from './auth.router';

const router: Router = Router();

//Root Endpoint for Authentification
router.use('/auth', AuthRouter);

router.get('/', async (req: Request, res: Response) => {
    res.send("User endpoint");
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    let { id } = req.params;
    const user = await User.findByPk(id);
    res.status(200).send(user);
});

export const UserRouter: Router = router;