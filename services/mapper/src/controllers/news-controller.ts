import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';

import HeadlinesBody from '../models/HeadLinesBody';
import HttpError from '../models/Http-Error';
import NewsModel, { INews } from '../models/db/NewsModel';
import SourceModel, { ISource } from '../models/db/SourceModel';
import SubscriberModel, { ISubscriber } from '../models/db/SubscriberModel';
import SourceBody from '../models/SourceBody';
import SourceUpdatesModel from '../models/db/SourceUpdatesModel';
import PublishedSourceModel from '../models/db/PublishedSourceModel';

export async function requestSource(req: Request, res: Response, next: NextFunction) {
  try {
    // check if any source exists
    const sources = await SourceModel.find({}).distinct('_id');
    if (!sources || sources.length === 0) {
      return res.status(426).json({ message: 'No sources available.', updateRequest: true });
    }
    // check if any source updates occurred  today
    const updatedToday = await SourceUpdatesModel.findOne({
      createdAt: {
        $gt: new Date().setHours(0, 0, 0, 0),
      },
    });
    if (!updatedToday) {
      // request update source
      return res
        .status(426)
        .json({ message: 'Daily source update is required.', updateRequest: true });
    }

    // send a source
    const updateInProgressSources = await PublishedSourceModel.find({}).distinct('sourceId');
    const source = await SourceModel.find({ _id: { $nin: updateInProgressSources } })
      .sort({
        seqNum: 'asc',
      })
      .limit(1);
    if (!source || source.length !== 1) {
      return res
        .status(404)
        .json({ message: 'Could not find an available source. ', updateRequest: true });
    }

    // save the source to the published sources collection
    await new PublishedSourceModel({ sourceId: source[0]._id }).save();

    // send the source
    return res.json({ updateRequest: false, source: source[0] });
  } catch (error) {
    return next(new HttpError(`Error: ${error.message}`, 500));
  }
}

export async function setRenewSources(req: Request, res: Response, next: NextFunction) {
  const sources: Array<SourceBody> = req.body.sources;
  try {
    const existingSources = await SourceModel.find({});
    if (!existingSources || existingSources.length === 0) {
      await SourceModel.insertMany(sources);
      return res.json({ message: 'updated', updateCount: sources.length });
    }

    const newSources = sources.filter(
      (src) => existingSources.find((eSrc) => eSrc.id === src.id) === undefined,
    );

    if (newSources.length === 0) {
      return res.json({ message: 'no-op', updateCount: 0 });
    }

    await SourceModel.insertMany(
      newSources.map((nSource) => ({ ...nSource, seqNum: existingSources[0].seqNum - 1 })),
    );
    return res.json({ message: 'updated', updateCount: newSources.length });
  } catch (error) {
    return next(new HttpError(`Error: ${error.message}`, 500));
  }
}

export async function createAndPublishHeadlines(req: Request, res: Response, next: NextFunction) {
  const headlines: HeadlinesBody = req.body;
  try {
    if (headlines.totalResults === 0) {
      return res.json({ message: 'No news found, so no data added!' });
    }
    if (!headlines.source) {
      return res.json({ message: 'No source found, so no data added!' });
    }
    if (headlines.news.length === 0 || headlines.totalResults !== headlines.news.length) {
      throw new HttpError('Corrupt data provided! No data added!', 400);
    }
    const savedHeadlines: Array<INews> = await NewsModel.insertMany(headlines.news);

    await PublishedSourceModel.deleteOne({ sourceId: headlines.source._id });

    const subscribers: Array<ISubscriber> = await SubscriberModel.find({ active: true });

    const idsAndTitles = savedHeadlines.map((headline: INews) => ({
      id: headline._id,
      title: headline.title,
    }));

    const publishStatus = { success: 0, failure: 0 };
    for (const subscriber of subscribers) {
      // if one subscriber fails, keep publishing, do not crash
      try {
        await fetch(`${subscriber.host}:${subscriber.port}/${subscriber.endpoint}`, {
          method: subscriber.method,
          body: JSON.stringify({ news: idsAndTitles }),
          headers: { 'Content-Type': 'application/json' },
        });
        publishStatus.success++;
      } catch (error) {
        console.error({
          message: error.message,
          subscriber: `${subscriber.host}:${subscriber.port}/${subscriber.endpoint}`,
          status: 'Failed to publish',
        });
        publishStatus.failure++;
      }
    }

    return res.json({
      db: { status: 'success', total: savedHeadlines.length },
      publish: publishStatus,
    });
  } catch (error) {
    return error instanceof HttpError ? next(error) : next(new HttpError(error.message, 500));
  }
}
