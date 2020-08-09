import {
  ESTweetResult,
  ESNewsResult,
  ESVideosResult,
  ESRedditResult,
  ESHit,
  ESInnerHit,
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
      body: JSON.stringify({ aggs: aggregations }),
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
      news: {
        items: news.hits.hits.map((hit: ESHit<ESNews>) => ({
          ...hit._source,
          id: hit._id,
        })),
        aggregations: news.aggregations,
        dates: news.aggregations.dates,
        [AggregationConstantType.categories]:
          news.aggregations && news.aggregations.categories
            ? filterAggregation(news.aggregations.categories, categories)
            : [],
        sources:
          news.aggregations && news.aggregations.sources
            ? filterAggregation(news.aggregations.sources, sources)
            : [],
        languages:
          news.aggregations && news.aggregations.languages
            ? filterAggregation(news.aggregations.languages, languages)
            : [],
      },
      videos: {
        items: videos.hits.hits.flatMap((hit: ESInnerHit<ESHit<ESVideo>>) =>
          hit.inner_hits.results.hits.hits.map(
            (innerHit: ESHit<ESVideo>) => innerHit._source
          )
        ),
        aggregations: videos.aggregations,
        dates: videos.aggregations.dates,
        categories:
          videos.aggregations && videos.aggregations.categories
            ? filterAggregation(videos.aggregations.categories, categories)
            : [],
        sources:
          videos.aggregations && videos.aggregations.sources
            ? filterAggregation(videos.aggregations.sources, sources)
            : [],
        languages:
          videos.aggregations && videos.aggregations.languages
            ? filterAggregation(videos.aggregations.languages, languages)
            : [],
      },
      redditPosts: {
        items: redditPosts.hits.hits.flatMap(
          (hit: ESInnerHit<ESHit<ESRedditPost>>) =>
            hit.inner_hits.results.hits.hits.map(
              (innerHit: ESHit<ESRedditPost>) => innerHit._source
            )
        ),
        aggregations: redditPosts.aggregations,
        dates: redditPosts.aggregations.dates,
        categories:
          redditPosts.aggregations && redditPosts.aggregations.categories
            ? filterAggregation(redditPosts.aggregations.categories, categories)
            : [],
        sources:
          redditPosts.aggregations && redditPosts.aggregations.sources
            ? filterAggregation(redditPosts.aggregations.sources, sources)
            : [],
        languages:
          redditPosts.aggregations && redditPosts.aggregations.languages
            ? filterAggregation(redditPosts.aggregations.languages, languages)
            : [],
      },
      tweets: {
        items: tweets.hits.hits.flatMap((hit: ESInnerHit<ESHit<ESTweet>>) =>
          hit.inner_hits.results.hits.hits.map(
            (innerHit: ESHit<ESTweet>) => innerHit._source
          )
        ),
        aggregations: tweets.aggregations,
        dates: tweets.aggregations.dates,
        categories:
          tweets.aggregations && tweets.aggregations.categories
            ? filterAggregation(tweets.aggregations.categories, categories)
            : [],
        sources:
          tweets.aggregations && tweets.aggregations.sources
            ? filterAggregation(tweets.aggregations.sources, sources)
            : [],
        languages:
          tweets.aggregations && tweets.aggregations.languages
            ? filterAggregation(tweets.aggregations.languages, languages)
            : [],
      },
    }));
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
