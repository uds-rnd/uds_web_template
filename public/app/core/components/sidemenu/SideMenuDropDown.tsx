import React, { FC } from 'react';
import _ from 'lodash';
import DropDownChild from './DropDownChild';
import { NavModelItem } from '@grafana/data';
import { config } from '@grafana/runtime';

interface Props {
  link: NavModelItem;
  onHeaderClick?: () => void;
}

const SideMenuDropDown: FC<Props> = (props) => {
  const { link, onHeaderClick } = props;
  let childrenLinks: NavModelItem[] = [];
  if (link.children) {
    if (link.id === 'dashboards') {
      let card: any = {
        icon: 'info-circle',
        id: 'generator-dashboards',
        text: 'View',
        url: '/fabc/All',
      };
      link.children.push(card);
    }

    childrenLinks = _.filter(link.children, (item) => !item.hideFromMenu);
    if (config.bootData.user.orgRole !== 'Admin') {
      childrenLinks = childrenLinks.filter((item) => item?.id !== 'manage-dashboards');
    }
  }
  return (
    <ul className="dropdown-menu dropdown-menu--sidemenu" role="menu">
      <li className="side-menu-header">
        <a className="side-menu-header-link" href={link.url} onClick={onHeaderClick}>
          <span className="sidemenu-item-text">{link.text}</span>
        </a>
      </li>
      {childrenLinks
        .filter((item) => item?.id !== 'upgrading')
        .map((child, index) => {
          return <DropDownChild child={child} key={`${child.url}-${index}`} />;
        })}
    </ul>
  );
};

export default SideMenuDropDown;
