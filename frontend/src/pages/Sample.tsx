import React from 'react';
import sample from '../data/sample.json';

const Sample = () => {
  return (
    <pre style={{ textAlign: 'left' }}>{JSON.stringify(sample, null, 2)}</pre>
  );
};

export default Sample;
