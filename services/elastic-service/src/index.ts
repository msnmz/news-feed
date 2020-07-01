import express, { Request, Response, NextFunction, query } from 'express';
import { json } from 'body-parser';
import fetch from 'node-fetch';
import { Client } from '@elastic/elasticsearch';

import HttpError from '../../shared/models/Http-Error';
import { indexData } from './controllers/data-controller';
import { startBulkDataInsertion } from './controllers/bulk-data-controller';

subscribeForDataUpdates();

const client = new Client({
  cloud: {
    id: process.env.ELASTICSEARCH_CLOUD_ID!,
    username: process.env.ELASTICSEARCH_CLOUD_USERNAME!,
    password: process.env.ELASTICSEARCH_CLOUD_PASSWORD!,
  },
});

const app = express();

app.use(json({ limit: '100mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

app.post('/data', indexData.bind(null, client));

app.get('/suggest', async (req: Request, res: Response, next: NextFunction) => {
  const searchQuery = req.query.search as string;
  console.log({ searchQuery });
  suggest(searchQuery)
    .then((values) => res.json({ results: values }))
    .catch((error: Error) => res.json({ error }));
});

app.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  const searchQuery = req.query.search as string;
  const results = {
    news: [] as any[],
    videos: [] as any[],
    redditPosts: [] as any[],
    tweets: [] as any[],
    errors: {
      news: {} as Error,
      videos: {} as Error,
      redditPosts: {} as Error,
      tweets: {} as Error,
    },
  };
  // Promise.all
  try {
    results.news = await search(searchQuery, 'autoComplete', []);
  } catch (error) {
    results.errors.news = error;
  }
  try {
    results.videos = await search(searchQuery, 'videos.title', []);
  } catch (error) {
    results.errors.videos = error;
  }
  try {
    results.redditPosts = await search(searchQuery, 'redditPosts.title', []);
  } catch (error) {
    results.errors.redditPosts = error;
  }
  try {
    results.tweets = await search(searchQuery, 'tweets.text', []);
  } catch (error) {
    results.errors.tweets = error;
  }
  return res.json({ results });
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

app.listen(process.env.PORT || process.env.CLIENT_POSSIBLE_PORT);

function subscribeForDataUpdates(): void {
  fetch(`${process.env.MAPPER_URL}${process.env.SUBSCRIPTION_FOR_DATA_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: process.env.SELF,
      port: process.env.PORT ? Number.parseInt(process.env.PORT) : process.env.CLIENT_POSSIBLE_PORT,
      endpoint: 'data',
      method: 'POST',
      prod: process.env.NODE_ENV,
    }),
  })
    .then((resp) => resp.json())
    .then((message) => console.log({ message }))
    .catch(console.error);
}

interface IHits {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  highlights: [{ title: string; description: string }];
}

async function suggest(queryString: string) {
  return client.search({
    index: 'news-en',
    _source: ['_id', 'title'],
    body: {
      query: {
        match: {
          autoComplete: queryString,
        },
      },
      suggest: {
        text: queryString,
        autoComplete: {
          term: {
            field: 'title',
          },
        },
      },
    },
  });
}

function search(
  queryString: string,
  field: string,
  _source?: string | string[] | undefined,
): Promise<IHits[]> {
  return client
    .search({
      index: 'news-en',
      _source,
      body: {
        query: {
          match: {
            [field]: queryString,
          },
        },
      },
    })
    .then((resp: any) => resp.body.hits)
    .catch((err) => {
      throw err;
    });
}

startBulkDataInsertion(client);
