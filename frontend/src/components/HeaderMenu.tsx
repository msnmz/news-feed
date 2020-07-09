import React, { useState } from 'react';
import { Menu, Segment, MenuItemProps } from 'semantic-ui-react';
import { useHistory, useParams } from 'react-router-dom';

const HeaderMenu = () => {
  const [activeItem, setActiveItem] = useState('home');

  const history = useHistory();
  const tag = useParams();

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    { name }: MenuItemProps
  ) => {
    setActiveItem(name!);
    history.push(`/${name}`);
  };

  return (
    <Segment inverted>
      <Menu inverted pointing secondary>
        <Menu.Item
          name='home'
          active={activeItem === 'home'}
          onClick={handleItemClick}
        />
        <Menu.Item
          name='sample'
          active={activeItem === 'sample'}
          onClick={handleItemClick}
        />
        <Menu.Item
          name='mapping'
          active={activeItem === 'mapping'}
          onClick={handleItemClick}
        />
      </Menu>
    </Segment>
  );
};

export default HeaderMenu;
