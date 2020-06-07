import { YoutubeVideoModel } from './YoutubeVideoModel';
import { RawNews } from '../../../../shared/models/RawNews';

export type EnhancedNews = RawNews & {
  videos: Array<YoutubeVideoModel>;
};
