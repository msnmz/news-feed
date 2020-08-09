import express, { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import cors from 'cors';

import HttpError from '../../shared/models/Http-Error';
import { indexData, subscribeForDataUpdates } from './controllers/data-controller';
import { client } from './models/Client';
import { autoComplete, searchNews } from './controllers/search-controller';

subscribeForDataUpdates();

const app = express();

app.use(cors());
app.use(json({ limit: '100mb' }));

app.post('/data', indexData.bind(null, client));
app.get('/suggest', autoComplete);
app.post('/search', searchNews);

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

const port = process.env.PORT || process.env.CLIENT_POSSIBLE_PORT;

app.listen(port, () => {
  console.log('Elastic service listening on port', port);
});
