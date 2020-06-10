import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { RawNews } from '../../../shared/models/RawNews';
import { Twitter } from '../models/Twitter';
import { EnhancedTwitterNews } from '../models/types/EnhancedTwitterNews';

export async function enhanceNewsWithTweets(req: Request, res: Response, next: NextFunction) {
  console.log('Data received for enhancement...');
  const news: Array<RawNews> = req.body.news;
  if (news.length === 0) return res.json({ message: 'No news found!' });
  // end the response
  res.json({ message: 'enhancement started' });

  const twitter = new Twitter();
  const enhancedNews: Array<EnhancedTwitterNews> = await twitter.bulkSearch(news);

  try {
    console.log(`Enhancement sent for ${enhancedNews.length} news.`);
    const resp = await fetch(
      `${process.env.MAPPER_URL}${process.env.HEADLINES_ENHANCEMENT_ENDPOINT}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headlines: enhancedNews }),
      },
    );
    const message = await resp.json();
    console.log(`Enhancement response: ${JSON.stringify(message, null, 2)}`);
  } catch (error) {
    console.log(`Enhancement received an error: ${error.message}`);
  }
}
