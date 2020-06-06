import { NewsAPICountry } from '../constants/NewsAPICountry';
import { NewsAPICategory } from '../constants/NewsAPICategory';
import { NewsAPILanguage } from '../constants/NewsAPILanguage';
import { NewsAPISort } from '../constants/NewsAPISort';

export enum NewsAPIParamsType {
  TopHeadlines = 'top-headlines-api-params',
  Everything = 'everything-api-params',
  Source = 'source-api-params',
}

export interface NewsAPITopHeadlinesParams {
  type?: NewsAPIParamsType.TopHeadlines;
  country?: NewsAPICountry;
  category?: NewsAPICategory;
  sources?: string;
  q?: string;
  pageSize?: number;
  page?: number;
  [key: string]: string | number | undefined;
}

export interface NewsAPIEverythingParams {
  type?: NewsAPIParamsType.Everything;
  q?: string;
  qInTitle?: string;
  sources?: string;
  domains?: string;
  excludeDomains?: string;
  from?: string;
  to?: string;
  language?: NewsAPILanguage;
  sortBy?: NewsAPISort;
  pageSize?: number;
  page?: number;
  [key: string]: string | number | undefined;
}

export interface NewsAPISourcesParams {
  type?: NewsAPIParamsType.Source;
  language?: NewsAPILanguage;
  country?: NewsAPICountry;
  category?: NewsAPICategory;
  [key: string]: string | number | undefined;
}

export type NewsAPIParams =
  | NewsAPITopHeadlinesParams
  | NewsAPIEverythingParams
  | NewsAPISourcesParams;
