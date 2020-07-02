import { ESVideo } from './ESVideo';
import { ESRedditPost } from './ESRedditPost';
import { ESTweet } from './ESTweet';

export interface ESNews {
  id: string;
  source: {
    id?: string;
    name?: string;
    description?: string;
    url?: string;
    category?: string;
    language?: string;
    country?: string;
  };
  author?: string;
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  content?: string;
  videos?: ESVideo[];
  redditPosts?: ESRedditPost[];
  tweets?: ESTweet[];
}
