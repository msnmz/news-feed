import { NewsAPIResponseStatus } from '../constants/NewsAPIResponseStatus';
import { NewsAPIArticle } from './NewsAPIArticle';
import { NewsAPISource } from './NewsAPISource';

export interface NewsAPIResponse {
  status: NewsAPIResponseStatus;
}

export class NewsAPIResponseError extends Error implements NewsAPIResponse {
  code: string;
  status: NewsAPIResponseStatus;
  constructor(message: string, status: NewsAPIResponseStatus, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface NewsAPIResponseArticles extends NewsAPIResponse {
  totalResults: number;
  articles: Array<NewsAPIArticle>;
}

export interface NewsAPIResponseSources extends NewsAPIResponse {
  sources: Array<NewsAPISource>;
}
