import { Router } from 'express';

import { createHotel, retrieveSpesificHotel, retrieveHotel } from '../handlers/hotel';
import { translateText } from '../handlers/translate';

const globalRouter = Router();

globalRouter.get('/hotels/:hotelId', retrieveSpesificHotel);
globalRouter.route('/hotels/').get(retrieveHotel).post(createHotel);

globalRouter.post('/translate/', translateText);

export default globalRouter;