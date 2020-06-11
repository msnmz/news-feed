import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItemProps } from 'semantic-ui-react';

const TabularMenu = (props: {
  items: string[];
  onMenuItemSelected?: Function;
}) => {
  const { items, onMenuItemSelected } = props;

  const [activeItem, setActiveItem] = useState(items[0]);

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    { name }: MenuItemProps
  ) => {
    setActiveItem(name!);
    onMenuItemSelected && onMenuItemSelected(name);
  };

  return (
    <Menu tabular>
      {items.map((item: string) => (
        <Menu.Item
          key={`tabular_menu_${item}`}
          name={item}
          active={activeItem === item}
          onClick={handleItemClick}
        />
      ))}
    </Menu>
  );
};

TabularMenu.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string),
  onMenuItemSelected: PropTypes.func,
};

export default TabularMenu;
