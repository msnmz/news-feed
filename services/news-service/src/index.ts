import express, { Request, Response, NextFunction } from 'express';

import HttpError from '../../shared/models/Http-Error';
import { requestSource } from './controller/news-controller';

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

app.get('/reload-news', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await requestSource();
    console.log({ result });
    return res.json({ result: 'success' });
  } catch (error) {
    console.log({ error });
    return res.json({ result: 'failure', message: error.message });
  }
});

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

app.listen(process.env.PORT || 5000);
