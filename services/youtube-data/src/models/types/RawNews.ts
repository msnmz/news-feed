import { YoutubeVideoModel } from './YoutubeVideoModel';

export type RawNews = {
  id: string;
  title: string;
};

export type EnhancedNews = RawNews & {
  videos: Array<YoutubeVideoModel>;
};
