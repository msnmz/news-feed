import express, { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import mongoose from 'mongoose';

import HttpError from '../../shared/models/Http-Error';
import newsRoutes from './routes/news-route';
import subscriptionRoutes from './routes/subscribe-route';
import NewsModel from './models/db/NewsModel';
import SourceModel from './models/db/SourceModel';

const app = express();

app.use(json({ limit: '50mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

app.use('/news', newsRoutes);
app.use('/subscription', subscriptionRoutes);
app.get('/experimental', (req: Request, res: Response, next: NextFunction) => {
  NewsModel.updateMany({}, { $set: { indexed: false } })
    .then((resp) => res.json({ resp }))
    .catch((err: Error) => res.status(500).json({ message: err.message }));
});

app.get('/experimental-sources', (req: Request, res: Response, next: NextFunction) => {
  SourceModel.find({})
    .then((resp) => res.json(resp.map((src) => ({ key: src.id, text: src.name, value: src.id }))))
    .catch((err: Error) => res.status(500).json({ message: err.message }));
});

app.use((req: Request, res: Response, next: NextFunction) => {
  throw new HttpError('Could not find this route.', 404);
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

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-xa5ht.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: false,
    },
  )
  .then(() => {
    console.log('DB connection successful.');
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
