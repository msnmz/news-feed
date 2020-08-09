export interface AggregationRequest {
  path: AggregationType;
  type: string;
  values: string[];
}

export const enum AggregationType {
  Source = 'source',
  Category = 'category',
  Date = 'date',
  Language = 'language',
}

export function getQueriesForAggregations(search: string, withRequest: AggregationRequest[]) {
  return withRequest.map((req) => {
    switch (req.path) {
      case AggregationType.Category: {
        return simpleTermsQuery('source.category', req.values);
      }
      case AggregationType.Language: {
        return simpleTermsQuery('source.language', req.values);
      }
      case AggregationType.Source: {
        return simpleTermsQuery('source.id', req.values);
      }
      case AggregationType.Date: {
        if (search === 'autoComplete') {
          return simpleDateRangeQuery('createdAt', req.values);
        } else if (search === 'videos') {
          return simpleDateRangeQuery('videos.publishedAt', req.values);
        } else if (search === 'redditPosts') {
          return simpleDateRangeQuery('redditPosts.created', req.values);
        } else {
          return simpleDateRangeQuery('tweets.created_at', req.values);
        }
      }
    }
  });
}

export function nestedQuery(path: string, query: object) {
  return {
    nested: {
      path,
      inner_hits: {
        name: 'results',
      },
      query,
    },
  };
}

export function simpleMatchQuery(field: string, queryString: string) {
  return {
    match: {
      [field]: queryString,
    },
  };
}

export function simpleMatchAllQuery() {
  return {
    match_all: {},
  };
}

export function simpleTermQuery(field: string, queryString: string) {
  return {
    term: {
      [field]: queryString,
    },
  };
}

export function simpleTermsQuery(field: string, values: string[]) {
  return {
    terms: {
      [field]: values,
    },
  };
}

export function simpleDateRangeQuery(field: string, values: string[]) {
  return {
    range: {
      createdAt: {
        format: 'dd-MM-yyyy',
        gte: values[0],
        lte: values[0] + '||+7d',
      },
    },
  };
}

export function booleanAndQuery(queries: any[]) {
  return {
    bool: {
      must: [...queries],
    },
  };
}
