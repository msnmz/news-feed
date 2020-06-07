import { RedditRespDataModel } from './RedditRespDataModel';

export interface RedditRespModel<T> {
  kind?: string | null;
  data?: T | null;
}

export interface RedditRespListModel<T> {
  after?: any | null;
  before?: any | null;
  facets?: {} | null;
  modhash?: string | null;
  dist?: number | null;
  children?: Array<T> | null;
}

export type RedditSearchRespType = RedditRespModel<
  RedditRespListModel<RedditRespModel<RedditRespDataModel>>
>;
