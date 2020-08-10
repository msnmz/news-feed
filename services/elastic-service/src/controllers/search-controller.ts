import { Request, Response, NextFunction } from 'express';
import { suggest } from '../helpers/Suggest';
import {
  getQueriesForAggregations,
  AggregationRequest,
  simpleMatchQuery,
  simpleMatchAllQuery,
  booleanAndQuery,
  nestedQuery,
  simpleTermQuery,
} from '../helpers/Queries';
import { search } from '../helpers/Search';
import { simpleTermsAggregation } from '../helpers/Aggregations';
import { simpleDateHistogramAggregation } from '../helpers/Aggregations';
import { simpleValueCountAggregation } from '../helpers/Aggregations';

export async function autoComplete(req: Request, res: Response, next: NextFunction) {
  const searchQuery = req.query.search as string;
  suggest(searchQuery)
    .then((values) => res.json({ results: values }))
    .catch((error: Error) => res.json({ error }));
}

export async function searchAll(req: Request, res: Response, next: NextFunction) {
  const searchQuery = req.query.search as string;
  const aggs = req.body.aggs as AggregationRequest[];
  try {
    const responses = await Promise.all([
      searchNews(searchQuery, aggs),
      searchVideos(searchQuery, aggs),
      searchRedditPosts(searchQuery, aggs),
      searchTweets(searchQuery, aggs),
    ]);
    const [news, videos, redditPosts, tweets] = responses;
    return res.json({ news, videos, redditPosts, tweets });
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function searchSubjectPaginated(req: Request, res: Response, next: NextFunction) {
  const subject = req.params.subject as 'news' | 'videos' | 'redditPosts' | 'tweets';
  const { size, from } = req.body.page as { size: number; from: number };
  const searchQuery = req.query.search as string;
  const aggs = req.body.aggs as AggregationRequest[];
  try {
    let response;
    switch (subject) {
      case 'news':
        response = await searchNews(searchQuery, aggs, size, from);
        break;
      case 'videos':
        response = await searchVideos(searchQuery, aggs, size, from);
        break;
      case 'redditPosts':
        response = await searchRedditPosts(searchQuery, aggs, size, from);
        break;
      case 'tweets':
        response = await searchTweets(searchQuery, aggs, size, from);
        break;
      default:
        throw new Error('Subject not supported.');
    }
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ error });
  }
}

function searchNews(
  searchQuery: string,
  aggs: AggregationRequest[],
  size: number = 12,
  from: number = 0,
) {
  const baseQuery = (field: string) =>
    searchQuery ? simpleMatchQuery(field, searchQuery) : simpleMatchAllQuery();
  return search(
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
      languages: simpleTermsAggregation('source.language'),
      dates: simpleDateHistogramAggregation('createdAt'),
    },
    size,
    from,
  );
}

function searchVideos(
  searchQuery: string,
  aggs: AggregationRequest[],
  size: number = 12,
  from: number = 0,
) {
  const baseQuery = (field: string) =>
    searchQuery ? simpleMatchQuery(field, searchQuery) : simpleMatchAllQuery();
  return search(
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
      languages: simpleTermsAggregation('source.language'),
      dates: simpleDateHistogramAggregation('videos.publishedAt'),
    },
    size,
    from,
  );
}

function searchRedditPosts(
  searchQuery: string,
  aggs: AggregationRequest[],
  size: number = 12,
  from: number = 0,
) {
  const baseQuery = (field: string) =>
    searchQuery ? simpleMatchQuery(field, searchQuery) : simpleMatchAllQuery();
  return search(
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
      languages: simpleTermsAggregation('source.language'),
      dates: simpleDateHistogramAggregation('created'),
    },
    size,
    from,
  );
}

function searchTweets(
  searchQuery: string,
  aggs: AggregationRequest[],
  size: number = 12,
  from: number = 0,
) {
  const baseQuery = (field: string) =>
    searchQuery ? simpleMatchQuery(field, searchQuery) : simpleMatchAllQuery();
  return search(
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
      languages: simpleTermsAggregation('source.language'),
      dates: simpleDateHistogramAggregation('created_at'),
    },
    size,
    from,
  );
}
