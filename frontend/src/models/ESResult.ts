import { ESNews } from './ESNews';
import { ESVideo } from './ESVideo';
import { ESTweet } from './ESTweet';
import { ESRedditPost } from './ESRedditPost';

export type ESNewsResult = ESResult<ESHit<ESNews>>;
export type ESVideosResult = ESResult<ESInnerHit<ESHit<ESVideo>>>;
export type ESRedditResult = ESResult<ESInnerHit<ESHit<ESRedditPost>>>;
export type ESTweetResult = ESResult<ESInnerHit<ESHit<ESTweet>>>;

export interface ESResult<T> {
  total: {
    value: number;
    relation: string;
  };
  max_score: number;
  hits: T[];
}

export interface ESHit<T> {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _nested?: {
    field: string;
    offset: number;
  };
  _source: T;
}

export interface ESInnerHit<T> {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  inner_hits: {
    results: {
      hits: ESResult<T>;
    };
  };
}
