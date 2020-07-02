import React from 'react';
import { Card } from 'semantic-ui-react';
import PropTypes from 'prop-types';

const NewsCard = ({
  news,
}: {
  news: {
    image: string;
    header: string;
    meta: string;
    description: string;
    key: string;
  }[];
}) => {
  return <Card.Group stackable items={news} />;
};

NewsCard.propTypes = {
  news: PropTypes.arrayOf(
    PropTypes.shape({
      image: PropTypes.string,
      header: PropTypes.string,
      meta: PropTypes.string,
      description: PropTypes.string,
      key: PropTypes.string,
    })
  ),
};

export default NewsCard;
