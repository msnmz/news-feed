import fetch from 'node-fetch';
import { RedditSearchRespType } from './types/RedditRespModel';
import { RedditModel, RedditModelKeys } from './RedditModel';
import { RawNews } from '../../../shared/models/RawNews';
import { EnhancedRedditNews } from './types/EnhancedRedditNews';

export class Reddit {
  private searchUrl = 'https://www.reddit.com/search.json?q=';

  async search(query: string): Promise<Array<RedditModel>> {
    console.log(`Searching reddit for: ${query}`);
    const redditModels: Array<RedditModel> = [];
    const resp = await fetch(this.searchUrl + query);
    const redditResp: RedditSearchRespType = await resp.json();
    if (!redditResp.data) {
      console.log(`No results for ${query}`);
      return redditModels;
    }
    if (
      !redditResp.data.children ||
      redditResp.data.children.length === 0 ||
      redditResp.data.dist === 0
    ) {
      console.log(`No results for ${query}`);
      return redditModels;
    }
    redditResp.data.children.forEach((rModel) => {
      if (rModel.data) {
        redditModels.push(
          RedditModelKeys.reduce(
            (model: RedditModel, key) => ({ ...model, [key]: rModel.data![key] }),
            {} as RedditModel,
          ),
        );
      }
    });
    console.log(`Search completed for: ${query} with ${redditModels.length} results.`);
    return redditModels;
  }

  async bulkSearch(queries: Array<RawNews>): Promise<Array<EnhancedRedditNews>> {
    console.log(`Bulk search started for ${queries.length} news.`);
    const enhancedNews: Array<EnhancedRedditNews> = [];
    const results = { success: 0, failure: 0 };
    for (const rawNews of queries) {
      let enhanced: EnhancedRedditNews = { ...rawNews, redditPosts: [] };
      try {
        enhanced.redditPosts = await this.search(rawNews.title);
        results.success++;
      } catch (error) {
        console.log(`Reddit error for news (${rawNews.title}): ${error.message}`);
        results.failure++;
      }
      enhancedNews.push(enhanced);
    }
    console.log(
      `Bulk search completed for ${queries.length} news with ${results.success} success and ${results.failure} failures.`,
    );
    return enhancedNews;
  }
}
