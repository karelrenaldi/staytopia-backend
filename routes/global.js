import { Router } from 'express';

import { createHotel, retrieveHotel } from '../handlers/hotel';

const globalRouter = Router();

globalRouter.route('/hotels').post(createHotel);

export default globalRouter;