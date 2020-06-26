import { Request, Response, NextFunction } from 'express';
import { shim } from 'array.prototype.flatmap';
shim();
import { Client } from '@elastic/elasticsearch';
import HttpError from '../../../shared/models/Http-Error';

interface INews {
  [key: string]: any;
}

export async function indexData(
  client: Client,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> {
  const data: { news: INews[]; type: 'insert' | 'update'; source: string | undefined } = req.body;

  try {
    if (!data || !data.news || data.news.length === 0) {
      return res.json({ message: 'No data received!' });
    }

    if (data.type === 'insert') {
      const indexName = 'news-' + data.news[0].source.language;
      const body = data.news.flatMap((doc) => {
        const db_id = doc._id;
        delete doc._id;
        if (doc.source && doc.source._id) {
          delete doc.source._id;
        }
        return [{ index: { _index: indexName, _id: db_id } }, doc];
      });
      // check if the index exists
      if (!(await client.indices.exists({ index: indexName }))) {
        await client.indices.create({ index: indexName });
      }
      const { body: bulkResponse } = await client.bulk({ refresh: 'true', body });
      const { body: count } = await client.count({ index: indexName });
      console.log(`New count for ${indexName}: ${count}`);

      const erroredDocuments: any[] = [];
      if (bulkResponse.errors) {
        console.error(`Got error for ${indexName}`);
        const erroredIds: string[] = [];
        bulkResponse.items.forEach((action: any, i: number) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              operation: body[i * 2],
              document: body[i * 2 + 1],
            });
            erroredIds.push(body[i * 2 + 1]._id);
          }
        });
        console.log(erroredDocuments);
      }

      return res.json({ newCount: count, index: indexName, errors: erroredDocuments.length });
    } else {
      const indexName = 'news-' + data.source!;
      const body = data.news.flatMap((doc) => {
        const db_id = doc.id;
        delete doc.id;
        delete doc.title;
        return [{ update: { _index: indexName, _id: db_id } }, doc];
      });
      // check if the index exists
      if (!(await client.indices.exists({ index: indexName }))) {
        await client.indices.create({ index: indexName });
      }
      const { body: bulkResponse } = await client.bulk({ refresh: 'true', body });
      const { body: count } = await client.count({ index: indexName });
      console.log(`New count for ${indexName}: ${count}`);

      const erroredDocuments: any[] = [];
      if (bulkResponse.errors) {
        console.error(`Got error for ${indexName}`);
        const erroredIds: string[] = [];
        bulkResponse.items.forEach((action: any, i: number) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              operation: body[i * 2],
              document: body[i * 2 + 1],
            });
            erroredIds.push(body[i * 2 + 1]._id);
          }
        });
        console.log(erroredDocuments);
      }

      return res.json({ newCount: count, index: indexName, errors: erroredDocuments.length });
    }
  } catch (error) {
    return next(new HttpError(`Error: ${error.message}`, 500));
  }
}
