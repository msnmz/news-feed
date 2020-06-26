import { RawNews } from '../../../shared/models/RawNews';

export interface EnhancedNews extends RawNews {
  [key: string]: any[] | string;
}
