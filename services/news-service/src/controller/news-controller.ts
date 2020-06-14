import fetch from 'node-fetch';

import { NewsAPI, getTopHeadlinesForSingleSource } from '../../lib';
import { MapperSourceRequestResponse } from '../../../shared/responses/MapperSourceRequestResponse';
import { ISource } from '../../../mapper/src/models/db/SourceModel';

export async function requestSource() {
  try {
    const newsApi = new NewsAPI(process.env.NEWS_API_KEY!);
    console.log(
      `Requesting source from ${process.env.MAPPER_URL}${process.env.SOURCE_REQUEST_ENDPOINT}`,
    );
    const resp = await fetch(`${process.env.MAPPER_URL}${process.env.SOURCE_REQUEST_ENDPOINT}`);
    const mapperResponse: MapperSourceRequestResponse = await resp.json();
    console.log(`Response received: 
      ${JSON.stringify(mapperResponse, null, 2)}`);
    if (mapperResponse.updateRequest) {
      return await fetchSources(newsApi);
    } else {
      return await fetchHeadlines(mapperResponse.source!, newsApi);
    }
  } catch (error) {
    throw error;
  }
}

async function fetchSources(newsApi: NewsAPI) {
  try {
    console.log('Fetching sources...');
    const sourceResponse = await newsApi.sources();

    const sourceAmount = sourceResponse.sources.length;
    if (sourceAmount === 0) return;
    console.log('Source fetch successful...');

    console.log(`Sending sources to: ${process.env.MAPPER_URL}${process.env.SOURCE_SET_ENDPOINT}`);
    const resp = await fetch(`${process.env.MAPPER_URL}${process.env.SOURCE_SET_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources: sourceResponse.sources }),
    });

    return await resp.json();
  } catch (error) {
    throw error;
  }
}

async function fetchHeadlines(source: ISource, newsApi: NewsAPI) {
  try {
    console.log(`Fetching headlines for source ${source.id}: ${source.name}`);
    const headlines = await getTopHeadlinesForSingleSource(newsApi, source);
    console.log('Headlines fetch successful...');

    console.log(
      `Sending headlines to: ${process.env.MAPPER_URL}${process.env.SOURCE_SET_ENDPOINT}`,
    );
    const resp = await fetch(`${process.env.MAPPER_URL}${process.env.HEADLINES_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...headlines,
        source,
      }),
    });

    return await resp.json();
  } catch (error) {
    throw error;
  }
}
