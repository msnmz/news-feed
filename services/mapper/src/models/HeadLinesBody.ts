import { News } from '../../../shared/models/News';

type HeadlinesBody = {
  totalResults: number;
  news: Array<News>;
};

export default HeadlinesBody;
