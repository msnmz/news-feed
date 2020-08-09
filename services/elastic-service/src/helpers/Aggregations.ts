export function simpleValueCountAggregation(field: string) {
  return {
    value_count: {
      field,
    },
  };
}

export function simpleTermsAggregation(field: string) {
  return {
    terms: {
      field,
    },
  };
}

export function simpleDateHistogramAggregation(
  field: string,
  calendar_interval: string = 'week',
  format: string = 'dd-MM-yyyy',
) {
  return {
    date_histogram: {
      field,
      calendar_interval,
      format,
      min_doc_count: 1,
    },
  };
}
