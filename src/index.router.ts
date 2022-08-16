import { Router, Request, Response } from 'express';
import { UserRouter } from './controllers/v0/users/routes/user.router';
const router: Router = Router();

router.use('/', UserRouter);

export const IndexRouter: Router = router;