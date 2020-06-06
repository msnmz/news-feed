import { Request, Response, NextFunction } from 'express';
import { RawNews, EnhancedNews } from '../models/types/RawNews';
import VideoFetcher from '../models/VideoFetcher';
import fetch from 'node-fetch';

export async function enhanceNewsWithVideo(req: Request, res: Response, next: NextFunction) {
  console.log('Data received for enhancement...');
  const news: Array<RawNews> = req.body.news;
  if (news.length === 0) return res.json({ message: 'No news found!' });
  // end the response
  res.json({ message: 'enhancement started' });

  const fetcher = new VideoFetcher();
  const enhancedNews: Array<EnhancedNews> = [];
  for (const rawNews of news) {
    try {
      const videos = await fetcher.search(rawNews.title);
      enhancedNews.push({
        ...rawNews,
        videos: [...videos],
      });
    } catch (error) {
      console.log(`Fetch error: ${error.message}`);
    }
  }

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
