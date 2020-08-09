import { client } from '../models/Client';

interface IHits {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  highlights: [{ title: string; description: string }];
}

export function search(
  query: object,
  _source?: string | string[] | undefined,
  aggs?: {},
): Promise<IHits[]> {
  let body = aggs ? { query, aggs } : { query };
  return client
    .search({
      index: 'news-*',
      _source,
      body,
    })
    .then((resp: any) => resp.body)
    .catch((err) => {
      throw err;
    });
}
