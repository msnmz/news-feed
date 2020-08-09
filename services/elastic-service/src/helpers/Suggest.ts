import { client } from '../models/Client';

export async function suggest(queryString: string) {
  return client.search({
    index: 'news-*',
    _source: ['_id', 'title'],
    body: {
      query: {
        match: {
          autoComplete: queryString,
        },
      },
      suggest: {
        text: queryString,
        autoComplete: {
          term: {
            field: 'title',
          },
        },
      },
    },
  });
}
