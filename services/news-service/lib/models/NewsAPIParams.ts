import { NewsAPICountry } from '../constants/NewsAPICountry';
import { NewsAPICategory } from '../constants/NewsAPICategory';
import { NewsAPILanguage } from '../constants/NewsAPILanguage';
import { NewsAPISort } from '../constants/NewsAPISort';

export enum NewsAPIParamsType {
  TopHeadlines = 'top-headlines-api-params',
  Everything = 'everything-api-params',
  Source = 'source-api-params',
}

export type NewsAPITopHeadlinesParams = {
  country?: NewsAPICountry;
  category?: NewsAPICategory;
  sources?: string;
  q?: string;
  pageSize?: number;
  page?: number;
};

export type NewsAPITopHeadlinesParamsTyped = NewsAPITopHeadlinesParams & {
  type: NewsAPIParamsType.TopHeadlines;
};

export type NewsAPIEverythingParams = {
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
};

export type NewsAPIEverythingParamsTyped = NewsAPIEverythingParams & {
  type: NewsAPIParamsType.Everything;
};

export type NewsAPISourcesParams = {
  language?: NewsAPILanguage;
  country?: NewsAPICountry;
  category?: NewsAPICategory;
};

export type NewsAPISourcesParamsTyped = NewsAPISourcesParams & {
  type: NewsAPIParamsType.Source;
};

export type NewsAPIParams =
  | NewsAPITopHeadlinesParams
  | NewsAPIEverythingParams
  | NewsAPISourcesParams;

export type NewsAPIParamsTypeds =
  | NewsAPITopHeadlinesParamsTyped
  | NewsAPIEverythingParamsTyped
  | NewsAPISourcesParamsTyped;
