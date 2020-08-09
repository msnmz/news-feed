export interface Aggregation<T> {
  doc_count_error_upper_bound: number;
  sum_other_doc_count: number;
  buckets: T[];
}
export interface ESBucket<T> {
  key_as_string?: string;
  key: T;
  doc_count: number;
}

export interface ESAggregations {
  languages?: Aggregation<ESBucket<string>>;
  sources?: Aggregation<ESBucket<string>>;
  count?: {
    value: number;
  };
  dates?: Aggregation<ESBucket<string>>;
  categories?: Aggregation<ESBucket<string>>;
}
