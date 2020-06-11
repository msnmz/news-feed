import _ from 'lodash';
import React from 'react';
import { Search, Grid, SearchProps, SearchResultData } from 'semantic-ui-react';

const source = [
  {
    title: 'Pellentesque maximus posuere imperdiet. Nullam eu molestie nibh.',
    description: '',
  },
  {
    title:
      'Donec sagittis fermentum sem eu gravida. Vestibulum lacinia fermentum congue.',
    description: '',
  },
  {
    title: 'Fusce tempus convallis erat, at tincidunt lorem dictum vitae.',
    description: '',
  },
  { title: 'Curabitur id varius augue.', description: '' },
  {
    title: 'In dui elit, bibendum id augue non, dictum dignissim tortor.',
    description: '',
  },
  {
    title: 'Suspendisse feugiat urna non neque scelerisque dictum.',
    description: '',
  },
  {
    title: 'Cras accumsan mauris vel nisl ornare, vitae interdum ipsum congue.',
    description: '',
  },
  {
    title: 'Praesent vel lobortis nunc. Nulla tempor lobortis lobortis.',
    description: '',
  },
];

const SearchField = (props: React.Props<SearchProps>) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState(source);
  const [value, setValue] = React.useState('');

  const handleResultSelect = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    { result }: SearchResultData
  ) => setValue(result.title);

  const handleSearchChange = (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    { value }: SearchProps
  ) => {
    setIsLoading(true);
    setValue(value ? value : '');

    setTimeout(() => {
      if (!value) {
        setValue('');
        setIsLoading(false);
        setResults(source);
        return;
      }
      setIsLoading(false);
      setResults(results.filter((res) => res.title.includes(value)));
    }, 300);
  };

  return (
    <Grid>
      <Grid.Column width={3}></Grid.Column>
      <Grid.Column width={10}>
        <Search
          fluid
          size='huge'
          loading={isLoading}
          onResultSelect={handleResultSelect}
          onSearchChange={_.debounce(handleSearchChange, 500, {
            leading: true,
          })}
          results={results}
          value={value}
        />
      </Grid.Column>
      <Grid.Column width={3}></Grid.Column>
    </Grid>
  );
};

export default SearchField;
