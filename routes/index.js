import { Router } from 'express';

import globalRoutes from './global';

const app = Router();

app.use('/', globalRoutes);

export default app;