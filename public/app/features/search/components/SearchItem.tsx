import React, { FC, useCallback } from 'react';
import { css } from 'emotion';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors';
import { TagList, Card, useStyles, Icon } from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';
import { DashboardSectionItem, OnToggleChecked } from '../types';
import { SearchCheckbox } from './SearchCheckbox';
import { SEARCH_ITEM_HEIGHT } from '../constants';

export interface Props {
  item: DashboardSectionItem;
  editable?: boolean;
  onTagSelected: (name: string) => any;
  onToggleChecked?: OnToggleChecked;
  results: any;
  moveUpToDash?: any;
  moveDownToDash?: any;
}

const selectors = e2eSelectors.pages.Dashboards;

export const SearchItem: FC<Props> = ({
  item,
  editable,
  onToggleChecked,
  onTagSelected,
  moveUpToDash,
  moveDownToDash,
}) => {
  const styles = useStyles(getStyles);
  const tagSelected = useCallback((tag: string, event: React.MouseEvent<HTMLElement>) => {
    onTagSelected(tag);
  }, []);

  const toggleItem = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (onToggleChecked) {
        onToggleChecked(item);
      }
    },
    [item]
  );

  const moveUpToDashWraper = (e: any) => {
    e.preventDefault();
    if (!moveUpToDash) {
      return;
    }
    moveUpToDash(item);
  };

  const moveDownToDashWraper = (e: any) => {
    e.preventDefault();
    if (!moveUpToDash) {
      return;
    }
    moveDownToDash(item);
  };

  return (
    <div>
      <Card
        aria-label={selectors.dashboards(item?.title)}
        heading={item?.title}
        href={item?.url}
        style={{ minHeight: SEARCH_ITEM_HEIGHT }}
        className={styles.container}
      >
        <Card.Figure align={'center'}>
          <SearchCheckbox editable={editable} checked={item?.checked} onClick={toggleItem} />
        </Card.Figure>
        {item?.folderTitle && <Card.Meta>{item?.folderTitle}</Card.Meta>}
        <Card.Tags>
          <div>
            {moveUpToDash ? (
              <div
                className={css`
                  width: 80px;
                  margin-right: 45px;
                  display: flex;
                  justify-content: space-around;
                `}
              >
                <Icon name={'arrow-up'} onClick={moveUpToDashWraper} />
                <Icon name={'arrow-down'} onClick={moveDownToDashWraper} />
              </div>
            ) : (
              <div></div>
            )}
          </div>
          <TagList tags={item?.tags} onClick={tagSelected} />
        </Card.Tags>
      </Card>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme) => {
  return {
    container: css`
      padding: ${theme.spacing.sm} ${theme.spacing.md};
    `,
  };
};
