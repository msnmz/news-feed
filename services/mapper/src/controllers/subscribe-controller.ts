import { Request, Response, NextFunction } from 'express';
import SubscriberBody from '../models/SubscriberBody';
import HttpError from '../models/Http-Error';
import SubscriberModel, { ISubscriber } from '../models/db/SubscriberModel';

export async function subscribe(req: Request, res: Response, next: NextFunction) {
  const subscriber: SubscriberBody = req.body;
  try {
    if (!subscriber || !subscriber.host || !subscriber.port || !subscriber.endpoint) {
      throw new HttpError('Missing arguments: host, port, endpoint', 400);
    }
    const subscriberInstance = new SubscriberModel({
      host: trimRight(subscriber.host, '/'),
      port: subscriber.port,
      endpoint: trim(subscriber.endpoint, '/'),
      method: subscriber.method ? subscriber.method : 'POST',
    });
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
