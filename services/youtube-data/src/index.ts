import express, { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import fetch from 'node-fetch';

import HttpError from '../../shared/models/Http-Error';
import * as DataEnhancer from './controllers/data-enhance-controller';

subscribeForDataEnhancement();

const app = express();

app.use(json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

app.post('/enhance-news', DataEnhancer.enhanceNewsWithVideo);

app.use((req: Request, res: Response, next: NextFunction) => {
  throw new HttpError('Could not find this route.', 404);
});

app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

app.listen(process.env.PORT || process.env.ENHANCER_POSSIBLE_PORT);

function subscribeForDataEnhancement(): void {
  fetch(`${process.env.MAPPER_URL}${process.env.SUBSCRIPTION_FOR_ENHANCEMENT_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: process.env.SELF,
      port: process.env.PORT
        ? Number.parseInt(process.env.PORT)
        : process.env.ENHANCER_POSSIBLE_PORT,
      endpoint: 'enhance-news',
      method: 'POST',
      prod: process.env.NODE_ENV,
    }),
  })
    .then((resp) => resp.json())
    .then((message) => console.log({ message }))
    .catch(console.error);
}
