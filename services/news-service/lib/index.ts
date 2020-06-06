import fetch from 'node-fetch';
import qs from 'querystring';
import {
  NewsAPITopHeadlinesParams,
  NewsAPISourcesParams,
  NewsAPIEverythingParams,
  NewsAPIParams,
  NewsAPIParamsType,
} from './models/NewsAPIParams';
import {
  NewsAPIResponseError,
  NewsAPIResponseArticles,
  NewsAPIResponseSources,
} from './models/NewsAPIResponse';
import { NewsAPIResponseStatus } from './constants/NewsAPIResponseStatus';
import { NewsAPISource } from './models/NewsAPISource';
import { NewsAPIArticle } from './models/NewsAPIArticle';
import { News } from '../../shared/models/News';

export class NewsAPI {
  private apiKey: string;
  private host = 'https://newsapi.org';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  topHeadlines(
    params: NewsAPITopHeadlinesParams,
    cached: boolean = false,
  ): Promise<NewsAPIResponseArticles> {
    return new Promise((resolve, reject) => {
      const checkResult = this.checkForRequiredParams({
        type: NewsAPIParamsType.TopHeadlines,
        ...params,
      });
      if (!checkResult.status) {
        reject(
          new NewsAPIResponseError(
            checkResult.message!,
            NewsAPIResponseStatus.ERROR,
            'argumentError',
          ),
        );
      }
      const url = this.createUrlFromEndpointAndOptions('/v2/top-headlines', params);
      this.getDataFromWeb(url, cached)
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    });
  }

  everything(
    params: NewsAPIEverythingParams,
    cached: boolean = false,
  ): Promise<NewsAPIResponseArticles> {
    return new Promise((resolve, reject) => {
      const checkResult = this.checkForRequiredParams({
        type: NewsAPIParamsType.Everything,
        ...params,
      });
      if (!checkResult.status) {
        reject(
          new NewsAPIResponseError(
            checkResult.message!,
            NewsAPIResponseStatus.ERROR,
            'argumentError',
          ),
        );
      }
      const url = this.createUrlFromEndpointAndOptions('/v2/everything', params);
      this.getDataFromWeb(url, cached)
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    });
  }

  sources(
    params: NewsAPISourcesParams = {},
    cached: boolean = false,
  ): Promise<NewsAPIResponseSources> {
    return new Promise((resolve, reject) => {
      const checkResult = this.checkForRequiredParams({
        type: NewsAPIParamsType.Source,
        ...params,
      });
      if (!checkResult.status) {
        reject(
          new NewsAPIResponseError(
            checkResult.message!,
            NewsAPIResponseStatus.ERROR,
            'argumentError',
          ),
        );
      }
      const url = this.createUrlFromEndpointAndOptions('/v2/sources', params);
      this.getDataFromWeb(url, cached)
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    });
  }

  private checkForRequiredParams(params: NewsAPIParams): { status: boolean; message?: string } {
    switch (params.type) {
      case NewsAPIParamsType.TopHeadlines:
        if (!params.country && !params.category && !params.sources && !params.q) {
          return {
            status: false,
            message:
              'One of the following params needs to be provided: country, category, sources, q.',
          };
        } else if ((params.category || params.country) && params.sources) {
          return {
            status: false,
            message: `You can't mix 'sources' param with the 'country' or 'category' params.`,
          };
        } else return { status: true };
      case NewsAPIParamsType.Everything:
        if (!params.q && !params.qInTitle && !params.domains && !params.sources) {
          return {
            status: false,
            message:
              'One of the following params needs to be provided: q, qInTitle, sources, domains.',
          };
        } else return { status: true };
      case NewsAPIParamsType.Source:
        return { status: true };
      default:
        return { status: false, message: 'Argument type unknown!' };
    }
  }

  private createUrlFromEndpointAndOptions(endpoint: string, params: NewsAPIParams): string {
    const query = qs.stringify(params);
    const baseURL = `${this.host}${endpoint}`;
    return query ? `${baseURL}?${query}` : baseURL;
  }

  private getDataFromWeb(url: string, cached: boolean) {
    const reqOptions: { headers: { [key: string]: string } } = {
      headers: { 'X-Api-Key': this.apiKey },
    };

    if (cached) {
      reqOptions.headers['X-No-Cache'] = 'true';
    }

    return fetch(url, reqOptions)
      .then((res) => res.json())
      .then((body) => {
        if (body.status === 'error')
          throw new NewsAPIResponseError(body.message, NewsAPIResponseStatus.ERROR, body.code);
        return body;
      })
      .catch((err) => {
        throw new NewsAPIResponseError(err.message, NewsAPIResponseStatus.ERROR, 'networkError');
      });
  }
}

export function groupSources(
  sources: Array<NewsAPISource>,
  size: number = 20,
): Array<Array<NewsAPISource>> {
  const groupedSources: Array<Array<NewsAPISource>> = [];
  if (size > 20) size = 20;
  const sourceAmount = sources.length;
  for (let i = 0; i < sourceAmount; i += size) {
    groupedSources.push(sources.slice(i, i + size > sourceAmount ? sourceAmount : i + size));
  }
  return groupedSources;
}

export async function getTopHeadlinesForSingleSource(
  newsApi: NewsAPI,
  source: NewsAPISource,
): Promise<{
  totalResults: number;
  news: Array<News>;
}> {
  const maxPageSize = 100;
  let news: Array<News> = [];
  const articlesResponse = await newsApi.topHeadlines({
    pageSize: maxPageSize,
    sources: source.id,
  });
  // map sources & articles => news
  articlesResponse.articles.forEach((article) => {
    if (article.source.id) {
      if (source) {
        return news.push({
          ...article,
          source: {
            ...source,
          },
        });
      }
    }
    return news.push({ ...article });
  });
  return { totalResults: news.length, news };
}

export async function getTopHeadlinesForSourcesList(
  newsApi: NewsAPI,
  sources: Array<NewsAPISource>,
): Promise<{
  totalResults: number;
  news: Array<News>;
}> {
  const maxPageSize = 100;
  const topHeadlines: Array<Promise<NewsAPIResponseArticles>> = [];
  sources.forEach((src) => {
    topHeadlines.push(
      newsApi.topHeadlines({
        pageSize: maxPageSize,
        sources: src.id,
      }),
    );
  });

  const articleResponses = await Promise.all(topHeadlines);

  let dailyTopNews: Array<News> = [];
  for (const articleList of articleResponses) {
    const articles = articleList.articles;
    // map sources & articles => news
    articles.forEach((article) => {
      if (article.source.id) {
        const source = sources.find((src) => src.id === article.source.id);
        if (source) {
          return dailyTopNews.push({
            ...article,
            source: {
              ...source,
            },
          });
        }
      }
      return dailyTopNews.push({ ...article });
    });
  }

  return { news: dailyTopNews, totalResults: dailyTopNews.length };
}

// needs to have paid account
export async function getEverythingBySources(
  newsApi: NewsAPI,
  sources: Array<NewsAPISource>,
): Promise<{
  sources: Array<NewsAPISource>;
  totalResults: number;
  articles: Array<NewsAPIArticle>;
}> {
  let articles: Array<NewsAPIArticle> = [];
  const pageLimitPerCategory = 60;
  const maxPageSize = 100;
  try {
    const everything: Array<Promise<NewsAPIResponseArticles>> = [];
    for (let p = 1; p <= pageLimitPerCategory; p++) {
      everything.push(
        newsApi.everything({
          sources: sources.map((src) => src.id).join(','),
          page: p,
          pageSize: maxPageSize,
        }),
      );
    }
    const articleResponses = await Promise.all(everything);
    for (const articleResponse of articleResponses) {
      articles = [...articles, ...articleResponse.articles];
    }

    return { sources, articles, totalResults: articles.length };
  } catch (error) {
    throw error;
  }
}
