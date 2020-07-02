import _, { Function, result } from 'lodash';
import React from 'react';
import { Grid, SearchResultData, Message } from 'semantic-ui-react';
import Autosuggest from 'react-autosuggest';
import './SearchField.css';

interface IHighlight {
  title?: string[] | undefined;
  description?: string[] | undefined;
}
interface IHits {
  hits: IMatch[];
  max_score: number;
  total: { value: number; relation: string };
}

interface IResult {
  body: {
    hits: IHits;
    suggest: {
      autoComplete: ISuggestion[];
    };
  };
}

interface ISuggestion {
  [key: string]: any;
  length: number;
  offset: number;
  text: string;
  options: ISuggestionOption[];
}

interface ISuggestionOption {
  text: string;
  score: number;
  freq: number;
}

interface IMatch {
  [key: string]: any;
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

interface ISuggestionResults {
  title: string;
  suggestions: IMatch[] | ISuggestion[];
}

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = (suggestion: ISuggestion | IMatch) => {
  if (suggestion.options !== undefined) {
    return suggestion.options.reduce(
      (acc: string, curr: ISuggestionOption): string =>
        (acc + ' ' + curr.text).trim(),
      ''
    );
  } else {
    return getHitValue(suggestion as IMatch);
  }
};

// render suggestions.
const renderSuggestions = (suggestion: ISuggestion | IMatch) => (
  <span>{getSuggestionValue(suggestion)}</span>
);

const getHitValue = (hit: IMatch) =>
  hit._source!.title ? hit._source!.title : '';

const getHitRawValue = (hit: IMatch) => (hit._source ? hit._source.title : '');

// render suggestions.
const renderHit = (hit: IMatch) => (
  <span dangerouslySetInnerHTML={{ __html: getHitValue(hit) }}></span>
);

const renderSectionTitle = (section: ISuggestionResults) => {
  return <strong>{section.title}</strong>;
};

const getSectionSuggestions = (
  section: ISuggestionResults
): IMatch[] | ISuggestion[] => {
  return section.suggestions;
};

const SearchField = (props: {
  onSuggestionSelected?: (searchQuery: string) => void;
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<ISuggestionResults[]>(
    []
  );
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
        `${process.env.REACT_APP_ELASTIC_SERVICE_URL}/suggest?search=${value}`
      )
        .then((resp) => resp.json())
        .then((response: ISearchResponse) => {
          setError('');
          const maxSuggestions = response.results.body.suggest.autoComplete.reduce(
            (acc: number, curr: ISuggestion): number =>
              acc > curr.options.length ? acc : curr.options.length,
            0
          );
          const newSuggestions = [] as ISuggestion[];
          for (let index = 0; index < maxSuggestions; index++) {
            const options = [] as ISuggestionOption[];
            response.results.body.suggest.autoComplete.forEach((sg) => {
              if (
                sg.options.length != maxSuggestions &&
                sg.options.length > 0
              ) {
                options.push(sg.options[0]);
              } else if (sg.options.length > 0) {
                options.push(sg.options[index]);
              } else {
                options.push({ text: sg.text, freq: 0, score: 0 });
              }
            });
            newSuggestions.push({
              options,
              length: options.length,
              offset: 0,
              text: '',
            });
          }
          setSuggestions([
            { title: 'Suggester', suggestions: newSuggestions },
            {
              title: 'Matching News',
              suggestions: response.results.body.hits.hits,
            },
          ]);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setIsLoading(false));
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionSelected = (
    e: React.FormEvent,
    { suggestion }: { suggestion: ISuggestion | IMatch }
  ) => {
    props.onSuggestionSelected &&
      props.onSuggestionSelected(getSuggestionValue(suggestion));
  };

  const handleSearchOnKeyPress = (event: { key: string }) => {
    if (event.key === 'Enter') {
      props.onSuggestionSelected && props.onSuggestionSelected(value);
    }
  };

  return (
    <Grid>
      <Grid.Column width={3}></Grid.Column>
      <Grid.Column width={10}>
        {error && <Message error content={error} />}
        <Autosuggest
          suggestions={suggestions}
          multiSection={true}
          renderSectionTitle={renderSectionTitle}
          getSectionSuggestions={getSectionSuggestions}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestions}
          onSuggestionSelected={onSuggestionSelected}
          inputProps={{
            onChange: (_event, { newValue }) => setValue(newValue),
            onKeyPress: handleSearchOnKeyPress,
            value,
          }}
        />
      </Grid.Column>
      <Grid.Column width={3}></Grid.Column>
    </Grid>
  );
};

export default SearchField;
