import { writeFile } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

import {
  NewsAPI,
  groupSources,
  getEverythingBySources,
  getTopHeadlinesForSourcesList,
} from '../lib';
import { NewsAPISource } from '../lib/models/NewsAPISource';
import { NewsAPIArticle } from '../lib/models/NewsAPIArticle';
import { News } from '../../shared/models/News';

const newsApi = new NewsAPI(process.env.NEWS_API_KEY!);

function main(): void {
  setInterval(async () => {
    try {
      const sourceResponse = await newsApi.sources();
      const sourceAmount = sourceResponse.sources.length;
      if (sourceAmount === 0) return;

      let { news: dailyNews, totalResults } = await getTopHeadlinesForSourcesList(
        newsApi,
        sourceResponse.sources,
      );

      writeFile(
        path.join(__dirname, '..', 'data', 'news.json'),
        JSON.stringify(dailyNews, null, 2),
        { encoding: 'utf-8' },
        (err) => {
          if (err) throw err;
          console.log(`News mapped & saved. Total news: ${totalResults}`);
        },
      );
    } catch (error) {
      console.error(`Error (${error.code}): ${error.message}`);
    }
  }, 180 * 1000); // each 3-minute time
}

main();
