import React from 'react';
import { Card } from 'semantic-ui-react';

const items = [
  {
    image:
      'https://cdn.arstechnica.net/wp-content/uploads/2020/06/honda-760x380.jpg',
    header:
      'Honda halts production at some plants after being hit by a cyberattack',
    meta: 'Dan Goodin',
    description:
      'Security researchers suspect outage is the result of a ransomware infe...',
    key: 1,
  },
  {
    image:
      'https://cdn.arstechnica.net/wp-content/uploads/2020/06/honda-760x380.jpg',
    header:
      'Honda halts production at some plants after being hit by a cyberattack',
    meta: 'Dan Goodin',
    description:
      'Security researchers suspect outage is the result of a ransomware infe...',
    key: 2,
  },
  {
    image:
      'https://cdn.arstechnica.net/wp-content/uploads/2020/06/honda-760x380.jpg',
    header:
      'Honda halts production at some plants after being hit by a cyberattack',
    meta: 'Dan Goodin',
    description:
      'Security researchers suspect outage is the result of a ransomware infe...',
    key: 3,
  },
];

const NewsCard = () => {
  return <Card.Group stackable items={items} />;
};

export default NewsCard;
