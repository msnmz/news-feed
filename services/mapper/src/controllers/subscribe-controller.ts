import { Request, Response, NextFunction } from 'express';
import SubscriberBody from '../models/SubscriberBody';
import HttpError from '../../../shared/models/Http-Error';
import SubscriberModel from '../models/db/SubscriberModel';

export async function subscribeForData(req: Request, res: Response, next: NextFunction) {
  const subscriber: SubscriberBody = req.body;
  try {
    checkParamsForSubscriber(subscriber);
    // check for multiple subscriptions
    const existing = await checkExistingSubscriber(subscriber);
    if (existing.found) return res.json(existing.message);

    const subscriberInstance = new SubscriberModel({ ...existing.filterOptions, type: 'client' });
    await subscriberInstance.save();
    return res.json({
      message: 'Subscription successful',
      id: subscriberInstance._id,
      status: 'active',
    });
  } catch (error) {
    return error instanceof HttpError ? next(error) : next(new HttpError(error.message, 500));
  }
}

export async function subscribeForDataEnhancement(req: Request, res: Response, next: NextFunction) {
  const subscriber: SubscriberBody = req.body;
  try {
    checkParamsForSubscriber(subscriber);
    // check for multiple subscriptions
    const existing = await checkExistingSubscriber(subscriber);
    if (existing.found) return res.json(existing.message);

    const subscriberInstance = new SubscriberModel(existing.filterOptions);
    await subscriberInstance.save();
    return res.json({
      message: 'Subscription successful',
      id: subscriberInstance._id,
      status: 'active',
    });
  } catch (error) {
    return error instanceof HttpError ? next(error) : next(new HttpError(error.message, 500));
  }
}

function checkParamsForSubscriber(subscriber?: SubscriberBody): void | never {
  if (!subscriber || !subscriber.host || !subscriber.endpoint) {
    console.log({ subscriber });
    throw new HttpError('Missing arguments: host, port, endpoint', 400);
  }
  if (subscriber.prod && subscriber.prod !== 'production' && !subscriber.port) {
    console.log({ subscriber });
    throw new HttpError('Missing arguments: host, port, endpoint', 400);
  }
}

async function checkExistingSubscriber(
  subscriber: SubscriberBody,
): Promise<
  | {
      message?: { message: string; id: string; status: string } | undefined;
      found: boolean;
      filterOptions: {
        host: string;
        port?: number | undefined;
        endpoint: string;
        method: string;
        prod?: string | undefined;
      };
    }
  | never
> {
  // check for multiple subscriptions
  const filterOptions =
    subscriber.prod && subscriber.prod === 'production'
      ? {
          host: trimRight(subscriber.host, '/'),
          endpoint: trim(subscriber.endpoint, '/'),
          method: subscriber.method ? subscriber.method : 'POST',
          prod: subscriber.prod,
        }
      : {
          host: trimRight(subscriber.host, '/'),
          port: subscriber.port,
          endpoint: trim(subscriber.endpoint, '/'),
          method: subscriber.method ? subscriber.method : 'POST',
        };
  try {
    const existingSubscriber = await SubscriberModel.findOne(filterOptions);

    if (existingSubscriber) {
      return {
        message: {
          message: 'Existing subscriber',
          id: existingSubscriber._id,
          status: existingSubscriber.active ? 'active' : 'disabled',
        },
        found: true,
        filterOptions,
      };
    }
    return { found: false, filterOptions };
  } catch (error) {
    throw new HttpError(`Error occurred while checking existing subscriber: ${error.message}`, 500);
  }
}

function trimLeft(str: string, ch: string): string {
  if (ch.trim().length > str.trim().length) return str;
  if (str.trim().substring(0, ch.trim().length) === ch.trim())
    return str.trim().substring(ch.trim().length);
  return str.trim();
}

function trimRight(str: string, ch: string): string {
  if (ch.trim().length > str.trim().length) return str;
  if (str.trim().substring(ch.trim().length) === ch.trim())
    return str.trim().substring(0, str.trim().length - ch.trim().length);
  return str.trim();
}

function trim(str: string, ch: string): string {
  return trimLeft(trimRight(str, ch), ch);
}
