import React, { FC, useEffect } from 'react';
import { css, cx } from 'emotion';
import { useLocalStorage } from 'react-use';
import { GrafanaTheme } from '@grafana/data';
import { Icon, Spinner, stylesFactory, useTheme } from '@grafana/ui';
import { DashboardSection, OnToggleChecked } from '../../types';
// import { SearchCheckbox } from './SearchCheckbox';
import { getSectionIcon, getSectionStorageKey } from '../../utils';
import { getBackendSrv } from '@grafana/runtime';

interface SectionHeaderProps {
  editable?: boolean;
  onSectionClick: (section: DashboardSection) => void;
  onToggleChecked?: OnToggleChecked;
  section: DashboardSection;
  results: any;
  arrangeDashboard?: any;
  fileName?: any;
  check: any;
}

export const SectionHeaderCustom: FC<SectionHeaderProps> = ({
  section,
  onSectionClick,
  onToggleChecked,
  editable = false,
  results,
  arrangeDashboard,
  fileName,
  check,
}) => {
  const theme = useTheme();
  const styles = getSectionHeaderStyles(theme, section.selected, editable, section, check);
  const setSectionExpanded = useLocalStorage(getSectionStorageKey(section.title), true)[1];

  const uid = results
    .filter((element: any) => element?.title === section?.title)[0]
    ?.items.map((item: any) => item?.uid);

  useEffect(() => {
    if (uid.length >= 1 && uid[0] != null) {
      if (section.expanded && section?.title !== 'General') {
        getBackendSrv()
          .post('/fileload', { uid })
          .then((dataLoad: any) => {
            if (section?.title !== 'General') {
              arrangeDashboard({ order: dataLoad?.order, uidOrder: dataLoad?.uid });
            }
          });
      }
    }
  }, [section.expanded]);

  const onSectionExpand = () => {
    setSectionExpanded(!section.expanded);
    onSectionClick(section);
    // localStorage.setItem('openFile', JSON.stringify(fileName));
    localStorage.setItem('openFile', fileName);
    localStorage.setItem('openDefault', section?.title);
    // localStorage.setItem('openDefault', JSON.stringify(section?.title));
  };

  return (
    <div
      className={styles.wrapper}
      onClick={onSectionExpand}
      aria-label={section.expanded ? `Collapse folder ${section.id}` : `Expand folder ${section.id}`}
    >
      <div className={styles.icon}>
        <Icon name={getSectionIcon(section)} />
      </div>
      <div className={styles.text}>{section.title}</div>
      {section.itemsFetching ? (
        <Spinner />
      ) : (
        <div
          className={css`
            margin-right: 5px;
          `}
        >
          <Icon name={section.expanded ? 'angle-down' : 'angle-right'} />
        </div>
      )}
    </div>
  );
};

const getSectionHeaderStyles = stylesFactory(
  (theme: GrafanaTheme, selected = false, editable: boolean, section: any, check) => {
    const { sm } = theme.spacing;
    return {
      wrapper: cx(
        css`
          display: flex;
          align-items: center;
          font-size: ${theme.typography.size.base};
          padding: 8px;
          color: ${theme.colors.textWeak};
          background-color: ${theme.colors.dropdownBg};

          font-weight: ${check ? 'bold' : 'normal'};

          &:hover {
            color: ${theme.colors.textStrong};
          }
        `,
        'pointer',
        { selected }
      ),
      icon: css`
        padding: 0 ${sm} 0 ${editable ? 0 : sm};
        position: ${section?.title !== 'General' ? 'static' : 'relative'};
        right: ${section?.title !== 'General' ? '0px' : '6px'};
      `,
      text: css`
        flex-grow: 1;
        line-height: 24px;
        position: ${section?.title !== 'General' ? 'static' : 'relative'};
        right: ${section?.title !== 'General' ? '0px' : '9px'};
      `,
      link: css`
        padding: 2px 10px 0;
        color: ${theme.colors.textWeak};
        opacity: 0;
        transition: opacity 150ms ease-in-out;
      `,
      separator: css`
        margin-right: 6px;
      `,
    };
  }
);
