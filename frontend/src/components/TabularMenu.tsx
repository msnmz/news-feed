import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItemProps } from 'semantic-ui-react';

const TabularMenu = (props: {
  items: string[];
  onMenuItemSelected?: Function;
}) => {
  const { items, onMenuItemSelected } = props;

  const [activeItem, setActiveItem] = useState(items[0]);

  useEffect(() => {
    setActiveItem((prev) => {
      const index = items.findIndex((item) =>
        item.startsWith(prev.split(' ')[0])
      );
      if (index >= 0) {
        return items[index];
      } else return prev;
    });
  }, [items]);

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
