import fetch from 'node-fetch';
import { shim } from 'array.prototype.flatmap';
shim();
import { Client } from '@elastic/elasticsearch';

let timer: NodeJS.Timeout;

export function startBulkDataInsertion(client: Client): void {
  timer = setInterval(fetchAndInsertBulkData.bind(null, client), 15000);
}

function fetchAndInsertBulkData(client: Client): void {
  interface INews {
    [key: string]: any;
  }
  interface GroupedNews {
    source: string;
    ids: string[];
    news: INews[];
  }
  fetch(`${process.env.MAPPER_URL}${process.env.DATA_REQUEST_ENDPOINT}`)
    .then((resp) => resp.json())
    .then(async (resp: { news: INews[]; count: number }) => {
      if (resp.count < 1000 && resp.news.length <= resp.count) {
        clearInterval(timer);
        console.log('Last bulk data indexing...');
      }
      if (resp.news.length > 0) {
        const newsBySources = resp.news!.reduce(
          (acc: GroupedNews[], curr: INews): GroupedNews[] => {
            let group = acc.find((gr) => gr.source === curr.source.language);
            if (group) {
              group.news = [...group.news, curr];
              group.ids = [...group.ids, curr._id];
              return acc!.map(
                (gr: GroupedNews): GroupedNews => (gr.source === group!.source ? group! : gr),
              );
            }
            group = { news: [curr], source: curr.source.language, ids: [curr._id] };
            return [...acc, group];
          },
          [] as GroupedNews[],
        );

        let indexedDocuments: string[] = [];

        for (const group of newsBySources) {
          const indexName = `news-${group.source}`;
          const body = group.news.flatMap((doc) => {
            const db_id = doc._id;
            delete doc._id;
            if (doc.source && doc.source._id) {
              delete doc.source._id;
            }
            if (doc.tweets && doc.tweets.length > 0) {
              doc.tweets.forEach((tweet: any) => {
                if (tweet.created_at) {
                  tweet.created_at = new Date(tweet.created_at).toISOString();
                }
              });
            }
            doc.suggest = doc.title;
            doc.autoComplete = doc.title;
            return [{ index: { _index: indexName, _id: db_id } }, doc];
          });
          // check if the index exists
          if (!(await client.indices.exists({ index: indexName }))) {
            await client.indices.create({ index: indexName });
          }
          const { body: bulkResponse } = await client.bulk({ refresh: 'true', body });
          const { body: count } = await client.count({ index: indexName });
          console.log(`New count for ${indexName}: ${count}`);
          if (bulkResponse.errors) {
            console.error(`Got error for ${indexName}`);
            const erroredDocuments: any[] = [];
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
            indexedDocuments = [
              ...indexedDocuments,
              ...group.ids.filter((newsId: string) => !erroredIds.includes(newsId)),
            ];
          } else {
            indexedDocuments = [...indexedDocuments, ...group.ids];
          }
        }
        await fetch(`${process.env.MAPPER_URL}${process.env.DATA_INDEX_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: indexedDocuments }),
        });
      }
    })
    .catch(console.error);
}
