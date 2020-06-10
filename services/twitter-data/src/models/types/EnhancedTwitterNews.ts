import { RawNews } from '../../../../shared/models/RawNews';
import { TweetModel } from '../TweetModel';

export type EnhancedTwitterNews = RawNews & {
  tweets: Array<TweetModel>;
};
