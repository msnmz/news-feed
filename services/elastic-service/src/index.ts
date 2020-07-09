import express, { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors';
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

app.use(cors());
app.use(json({ limit: '100mb' }));

app.post('/data', indexData.bind(null, client));

app.get('/suggest', async (req: Request, res: Response, next: NextFunction) => {
  const searchQuery = req.query.search as string;
  suggest(searchQuery)
    .then((values) => res.json({ results: values }))
    .catch((error: Error) => res.json({ error }));
});

interface AggregationRequest {
  path: AggregationType;
  type: string;
  values: string[];
}

const enum AggregationType {
  Source = 'source',
  Category = 'category',
  Date = 'date',
  Country = 'country',
}

function getQueriesForAggregations(search: string, withRequest: AggregationRequest[]) {
  return withRequest.map((req) => {
    switch (req.path) {
      case AggregationType.Category: {
        return simpleTermsQuery('source.category', req.values);
      }
      case AggregationType.Country: {
        return simpleTermsQuery('source.language', req.values);
      }
      case AggregationType.Source: {
        return simpleTermsQuery('source.id', req.values);
      }
      case AggregationType.Date: {
        if (search === 'autoComplete') {
          return simpleDateRangeQuery('createdAt', req.values);
        } else if (search === 'videos') {
          return simpleDateRangeQuery('videos.publishedAt', req.values);
        } else if (search === 'redditPosts') {
          return simpleDateRangeQuery('redditPosts.created', req.values);
        } else {
          return simpleDateRangeQuery('tweets.created_at', req.values);
        }
      }
    }
  });
}

app.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  const searchQuery = req.query.search as string;
  const aggs = req.body.aggs as AggregationRequest[];
  const baseQuery = (field: string) =>
    searchQuery ? simpleMatchQuery(field, searchQuery) : simpleMatchAllQuery();
  try {
    const responses = await Promise.all([
      search(
        aggs && aggs.length > 0
          ? booleanAndQuery([
              baseQuery('autoComplete'),
              ...getQueriesForAggregations('autoComplete', aggs),
            ])
          : baseQuery('autoComplete'),
        [
          '_id',
          'source',
          'author',
          'title',
          'description',
          'url',
          'urlToImage',
          'publishedAt',
          'content',
          'videos',
          'redditPosts',
          'tweets',
          'createdAt',
        ],
        {
          categories: simpleTermsAggregation('source.category'),
          sources: simpleTermsAggregation('source.id'),
          countries: simpleTermsAggregation('source.country'),
          dates: simpleDateHistogramAggregation('createdAt'),
        },
      ),
      search(
        aggs && aggs.length
          ? booleanAndQuery([
              ...getQueriesForAggregations('videos', aggs),
              nestedQuery(
                'videosIndependent',
                booleanAndQuery([
                  baseQuery('videosIndependent.title'),
                  simpleTermQuery('videosIndependent.youtubeId.kind.keyword', 'youtube#video'),
                ]),
              ),
            ])
          : nestedQuery(
              'videosIndependent',
              booleanAndQuery([
                baseQuery('videosIndependent.title'),
                simpleTermQuery('videosIndependent.youtubeId.kind.keyword', 'youtube#video'),
              ]),
            ),
        'false',
        {
          count: simpleValueCountAggregation('videos.youtubeId.videoId'),
          categories: simpleTermsAggregation('source.category'),
          sources: simpleTermsAggregation('source.id'),
          countries: simpleTermsAggregation('source.country'),
          dates: simpleDateHistogramAggregation('videos.publishedAt'),
        },
      ),
      search(
        aggs && aggs.length > 0
          ? booleanAndQuery([
              nestedQuery('redditPostsIndependent', baseQuery('redditPostsIndependent.title')),
              ...getQueriesForAggregations('redditPosts', aggs),
            ])
          : nestedQuery('redditPostsIndependent', baseQuery('redditPostsIndependent.title')),
        'false',
        {
          count: simpleValueCountAggregation('redditPosts.id.keyword'),
          categories: simpleTermsAggregation('source.category'),
          sources: simpleTermsAggregation('source.id'),
          countries: simpleTermsAggregation('source.country'),
          dates: simpleDateHistogramAggregation('created'),
        },
      ),
      search(
        aggs && aggs.length > 0
          ? booleanAndQuery([
              nestedQuery('tweetsIndependent', baseQuery('tweetsIndependent.text')),
              ...getQueriesForAggregations('tweets', aggs),
            ])
          : nestedQuery('tweetsIndependent', baseQuery('tweetsIndependent.text')),
        'false',
        {
          count: simpleValueCountAggregation('tweets.id_str'),
          categories: simpleTermsAggregation('source.category'),
          sources: simpleTermsAggregation('source.id'),
          countries: simpleTermsAggregation('source.country'),
          dates: simpleDateHistogramAggregation('created_at'),
        },
      ),
    ]);
    const [news, videos, redditPosts, tweets] = responses;
    return res.json({ news, videos, redditPosts, tweets });
  } catch (error) {
    return res.status(500).json({ error });
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

function nestedQuery(path: string, query: object) {
  return {
    nested: {
      path,
      inner_hits: {
        name: 'results',
      },
      query,
    },
  };
}

function simpleMatchQuery(field: string, queryString: string) {
  return {
    match: {
      [field]: queryString,
    },
  };
}

function simpleMatchAllQuery() {
  return {
    match_all: {},
  };
}

function simpleTermQuery(field: string, queryString: string) {
  return {
    term: {
      [field]: queryString,
    },
  };
}

function simpleTermsQuery(field: string, values: string[]) {
  return {
    terms: {
      [field]: values,
    },
  };
}

function simpleDateRangeQuery(field: string, values: string[]) {
  return {
    range: {
      createdAt: {
        format: 'dd-MM-yyyy',
        gte: values[0],
        lte: values[0] + '||+7d',
      },
    },
  };
}

function booleanAndQuery(queries: any[]) {
  return {
    bool: {
      must: [...queries],
    },
  };
}

function search(
  query: object,
  _source?: string | string[] | undefined,
  aggs?: {},
): Promise<IHits[]> {
  let body = aggs ? { query, aggs } : { query };
  return client
    .search({
      index: 'news-en',
      _source,
      body,
    })
    .then((resp: any) => resp.body)
    .catch((err) => {
      throw err;
    });
}

startBulkDataInsertion(client);

// aggregations

function simpleValueCountAggregation(field: string) {
  return {
    value_count: {
      field,
    },
  };
}

function simpleTermsAggregation(field: string) {
  return {
    terms: {
      field,
    },
  };
}

function simpleDateHistogramAggregation(
  field: string,
  calendar_interval: string = 'week',
  format: string = 'dd-MM-yyyy',
) {
  return {
    date_histogram: {
      field,
      calendar_interval,
      format,
      min_doc_count: 1,
    },
  };
}
