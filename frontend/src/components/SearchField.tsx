import _, { Function } from 'lodash';
import React from 'react';
import {
  Grid,
  SearchProps,
  SearchResultData,
  Message,
} from 'semantic-ui-react';
import Autosuggest from 'react-autosuggest';
import './SearchField.css';

interface IHighlight {
  title?: string[] | undefined;
  description?: string[] | undefined;
}
interface IResult {
  hits: IMatch[];
  max_score: number;
  total: { value: number; relation: string };
}

interface IMatch {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  highlight?: IHighlight | undefined;
  _source?: { title: string };
}

interface ISearchResponse {
  results: IResult;
}

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = (suggestion: IMatch) =>
  suggestion.highlight!.title
    ? suggestion.highlight!.title[0]
    : suggestion.highlight!.description![0];

const getSuggestionRawValue = (suggestion: IMatch) =>
  suggestion._source ? suggestion._source.title : '';

// render suggestions.
const renderSuggestion = (suggestion: IMatch) => (
  <span
    dangerouslySetInnerHTML={{ __html: getSuggestionValue(suggestion) }}
  ></span>
);

const SearchField = (props: {
  onSuggestionSelected?: (searchQuery: string) => void;
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<IMatch[]>([]);
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState('');

  const handleResultSelect = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    { result }: SearchResultData
  ) => setValue(result.title);

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  const onSuggestionsFetchRequested = ({ value }: { value: string }) => {
    if (value && value.length > 0)
      fetch(
        'https://elasticsearch-service.herokuapp.com/highlight?search=' + value
      )
        .then((resp) => resp.json())
        .then((response: ISearchResponse) => {
          console.log({ response });
          setError('');
          setResults(response.results.hits);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setIsLoading(false));
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  const onSuggestionsClearRequested = () => {
    setResults([]);
  };

  const onSuggestionSelected = (
    e: React.FormEvent,
    { suggestion }: { suggestion: IMatch }
  ) => {
    props.onSuggestionSelected &&
      props.onSuggestionSelected(suggestion._source!.title);
  };

  return (
    <Grid>
      <Grid.Column width={3}></Grid.Column>
      <Grid.Column width={10}>
        {error && <Message error content={error} />}
        <Autosuggest
          suggestions={results}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionRawValue}
          renderSuggestion={renderSuggestion}
          onSuggestionSelected={onSuggestionSelected}
          inputProps={{
            onChange: (_event, { newValue }) => setValue(newValue),
            value,
          }}
        />
      </Grid.Column>
      <Grid.Column width={3}></Grid.Column>
    </Grid>
  );
};

export default SearchField;
