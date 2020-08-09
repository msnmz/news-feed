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

export async function searchNews(req: Request, res: Response, next: NextFunction) {
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
          languages: simpleTermsAggregation('source.language'),
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
          languages: simpleTermsAggregation('source.language'),
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
          languages: simpleTermsAggregation('source.language'),
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
          languages: simpleTermsAggregation('source.language'),
          dates: simpleDateHistogramAggregation('created_at'),
        },
      ),
    ]);
    const [news, videos, redditPosts, tweets] = responses;
    return res.json({ news, videos, redditPosts, tweets });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
