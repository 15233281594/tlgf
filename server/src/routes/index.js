import { Router } from 'express';
import { getHealth } from '../modules/health/health.controller.js';
import { getCurrentUser } from '../modules/users/user.controller.js';

export const apiRouter = Router();

apiRouter.get('/health', getHealth);
apiRouter.get('/v1/users/me', getCurrentUser);
