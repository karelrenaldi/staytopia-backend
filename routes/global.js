import { Router } from 'express';

import { createHotel, retrieveSpesificHotel, retrieveHotel } from '../handlers/hotel';
import { translateText } from '../handlers/translate';
import { devHandler } from '../handlers/dev';

const globalRouter = Router();

globalRouter.get('/hotels/:hotelId', retrieveSpesificHotel);
globalRouter.route('/hotels/').get(retrieveHotel).post(createHotel);

globalRouter.post('/translate/', translateText);

globalRouter.get('/dev', devHandler);

export default globalRouter;