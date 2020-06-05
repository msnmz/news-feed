import { News } from '../../../shared/models/News';
import { ISource } from './db/SourceModel';

type HeadlinesBody = {
  totalResults: number;
  source: ISource;
  news: Array<News>;
};

export default HeadlinesBody;
