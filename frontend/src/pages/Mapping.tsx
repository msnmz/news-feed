import React from 'react';
import mapping from '../data/mapping.json';

const Mapping = () => {
  return (
    <>
      <pre style={{ textAlign: 'left', color: 'red' }}>PUT /_template/news</pre>
      <pre style={{ textAlign: 'left' }}>
        {JSON.stringify(mapping, null, 2)}
      </pre>
    </>
  );
};

export default Mapping;
