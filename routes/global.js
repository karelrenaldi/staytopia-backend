import { Router } from 'express';

import { createHotel, retrieveSpesificHotel } from '../handlers/hotel';

const globalRouter = Router();

globalRouter.get('/hotels/:hotelId', retrieveSpesificHotel);
globalRouter.route('/hotels').post(createHotel);

export default globalRouter;