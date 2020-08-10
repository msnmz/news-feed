import {
  ESTweetResult,
  ESNewsResult,
  ESVideosResult,
  ESRedditResult,
  ESHit,
  ESInnerHit,
  ESResult,
} from '../models/ESResult';
import { ESAggregations, ESBucket, Aggregation } from '../models/ESAggregation';
import { ESNews } from '../models/ESNews';
import { ESVideo } from '../models/ESVideo';
import { ESRedditPost } from '../models/ESRedditPost';
import { ESTweet } from '../models/ESTweet';
import { AggregationConstant } from '../constants/Constants';
import { categories } from '../constants/Categories';
import { sources } from '../constants/Sources';
import { languages } from '../constants/Languages';

export interface ESAggregationRequest {
  type: string;
  path: string;
  values: string[];
}

export interface ESSearchResult {
  news: { hits: ESNewsResult; aggregations: ESAggregations };
  videos: { hits: ESVideosResult; aggregations: ESAggregations };
  redditPosts: { hits: ESRedditResult; aggregations: ESAggregations };
  tweets: { hits: ESTweetResult; aggregations: ESAggregations };
}

export type ESData<T> = {
  items: T[];
  total: number;
  aggregations: ESAggregations;
  dates?: Aggregation<ESBucket<string>>;
} & Record<AggregationConstantType, AggregationConstant[]>;

export enum AggregationConstantType {
  categories = 'categories',
  sources = 'sources',
  languages = 'languages',
}

export function search(
  query: string,
  aggregations: ESAggregationRequest[]
): Promise<{
  tabs: { news: string; videos: string; redditPosts: string; tweets: string };
  news: ESData<ESNews>;
  videos: ESData<ESVideo>;
  redditPosts: ESData<ESRedditPost>;
  tweets: ESData<ESTweet>;
}> {
  return fetch(
    `${process.env.REACT_APP_ELASTIC_SERVICE_URL}/search?search=${query}`,
    {
      method: 'POST',
      body: JSON.stringify({
        aggs: aggregations,
      }),
      headers: {
        'Content-type': 'application/json',
      },
    }
  )
    .then((resp: Response) => resp.json() as Promise<ESSearchResult>)
    .then(({ news, videos, redditPosts, tweets }) => ({
      tabs: {
        news: `news (${news.hits.total.value})`,
        videos: `videos (${
          videos.aggregations.count?.value || videos.hits.total.value
        })`,
        redditPosts: `reddit posts (${
          redditPosts.aggregations.count?.value || redditPosts.hits.total.value
        })`,
        tweets: `tweets (${
          tweets.aggregations.count?.value || tweets.hits.total.value
        })`,
      },
      news: mapNewsResult(news.hits, news.aggregations),
      videos: mapDetailsResult<ESVideo>(videos.hits, videos.aggregations),
      redditPosts: mapDetailsResult<ESRedditPost>(
        redditPosts.hits,
        redditPosts.aggregations
      ),
      tweets: mapDetailsResult<ESTweet>(tweets.hits, tweets.aggregations),
    }));
}

export function searchPaginatedNews(
  query: string,
  aggregations: ESAggregationRequest[],
  page: { size: number; from: number }
): Promise<{
  tab: string;
  news: ESData<ESNews>;
}> {
  return fetch(
    `${process.env.REACT_APP_ELASTIC_SERVICE_URL}/search/news?search=${query}`,
    {
      method: 'POST',
      body: JSON.stringify({ aggs: aggregations, page }),
      headers: {
        'Content-type': 'application/json',
      },
    }
  )
    .then(
      (resp: Response) =>
        resp.json() as Promise<{
          hits: ESNewsResult;
          aggregations: ESAggregations;
        }>
    )
    .then(({ hits, aggregations }) => {
      const tab = `news (${hits.total.value})`;
      return {
        tab,
        news: mapNewsResult(hits, aggregations),
      };
    });
}

export function searchPaginated<T extends ESVideo | ESRedditPost | ESTweet>(
  subject: 'videos' | 'tweets' | 'redditPosts',
  query: string,
  aggregations: ESAggregationRequest[],
  page: { size: number; from: number }
): Promise<{
  tab: string;
  subject: ESData<T>;
}> {
  return fetch(
    `${process.env.REACT_APP_ELASTIC_SERVICE_URL}/search/${subject}?search=${query}`,
    {
      method: 'POST',
      body: JSON.stringify({ aggs: aggregations, page }),
      headers: {
        'Content-type': 'application/json',
      },
    }
  )
    .then(
      (resp: Response) =>
        resp.json() as Promise<{
          hits: ESResult<ESInnerHit<ESHit<T>>>;
          aggregations: ESAggregations;
        }>
    )
    .then(({ hits, aggregations }) => {
      const tab = `${subject} (${hits.total.value})`;
      return {
        tab,
        subject: mapDetailsResult(hits, aggregations),
      };
    });
}

function mapNewsResult(hits: ESNewsResult, aggregations: ESAggregations) {
  return {
    items: hits.hits.map((hit: ESHit<ESNews>) => ({
      ...hit._source,
      id: hit._id,
    })),
    aggregations: aggregations,
    dates: aggregations.dates,
    [AggregationConstantType.categories]:
      aggregations && aggregations.categories
        ? filterAggregation(aggregations.categories, categories)
        : [],
    sources:
      aggregations && aggregations.sources
        ? filterAggregation(aggregations.sources, sources)
        : [],
    languages:
      aggregations && aggregations.languages
        ? filterAggregation(aggregations.languages, languages)
        : [],
    total: hits.total.value,
  };
}

function mapDetailsResult<T extends ESRedditPost | ESVideo | ESTweet>(
  hits: ESResult<ESInnerHit<ESHit<T>>>,
  aggregations: ESAggregations
) {
  return {
    items: hits.hits.flatMap((hit: ESInnerHit<ESHit<T>>) =>
      hit.inner_hits.results.hits.hits.map(
        (innerHit: ESHit<T>) => innerHit._source
      )
    ),
    aggregations: aggregations,
    dates: aggregations.dates,
    categories:
      aggregations && aggregations.categories
        ? filterAggregation(aggregations.categories, categories)
        : [],
    sources:
      aggregations && aggregations.sources
        ? filterAggregation(aggregations.sources, sources)
        : [],
    languages:
      aggregations && aggregations.languages
        ? filterAggregation(aggregations.languages, languages)
        : [],
    total: hits.total.value,
  };
}

function filterAggregation(
  aggregation: Aggregation<ESBucket<string>>,
  aggregationConstants: AggregationConstant[]
) {
  return aggregationConstants
    .filter((aggConstant) =>
      aggregation.buckets.find((bucket) => bucket.key === aggConstant.key)
    )
    .map((aggConstant) => {
      const bucket = aggregation.buckets.find(
        (bucket) => bucket.key === aggConstant.key
      );
      if (bucket)
        return {
          ...aggConstant,
          text: `${aggConstant.text} (${bucket.doc_count})`,
        };
      else return aggConstant;
    });
}
