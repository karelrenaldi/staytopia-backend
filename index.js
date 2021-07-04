import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { DEFAULT_PORT, API_VERSION } from './configs/server';
import routes from './routes';

const main = () => {
  const app = express();
  const port = DEFAULT_PORT;

  dotenv.config({ path: `${__dirname}/.env` });

  app.use(cors());

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(process.env.API_PREFIX, routes);
  app.use((_, res) => {
    res.status(404).json({
      apiVersion: API_VERSION,
      error: {
        code: 404,
        message: 'Not Found!'
      }
    })
  })

  app.listen(port, () => {
    console.log(`Running on : ${process.env.BASE_URL}`);
  })
}

main();