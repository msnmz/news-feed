import { RawNews } from '../../../../shared/models/RawNews';
import { RedditModel } from '../RedditModel';

export type EnhancedRedditNews = RawNews & {
  redditPosts: Array<RedditModel>;
};
