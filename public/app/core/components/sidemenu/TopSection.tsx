import React, { FC } from 'react';
import _ from 'lodash';
import TopSectionItem from './TopSectionItem';
import config from '../../config';
import { getLocationSrv } from '@grafana/runtime';

// CustomSearchResults
import { SearchResultsCustom } from 'app/features/search/components/sideMenu/SearchResultsCustom';
import { FolderDTO } from 'app/types';
import { useManageDashboards } from 'app/features/search/hooks/useManageDashboards';
import { SearchLayout } from 'app/features/search/types';
import { useSearchQuery } from 'app/features/search/hooks/useSearchQuery';

export interface Props {
  folder?: FolderDTO;
}

const TopSection: FC<any> = ({ folder, params, updateLocation, ...rest }) => {
  const navTree = _.cloneDeep(config.bootData.navTree);
  const mainLinks = _.filter(navTree, (item) => !item.hideFromMenu).filter((item) => item?.id !== 'explore');
  const searchLink = {
    text: 'Search',
    icon: 'search',
  };
  const onOpenSearch = () => {
    getLocationSrv().update({ query: { search: 'open' }, partial: true });
  };

  const folderId = folder?.id;
  const defaultLayout = folderId ? SearchLayout.List : SearchLayout.Folders;
  const queryParams = {
    skipRecent: true,
    skipStarred: true,
    folderIds: folderId ? [folderId] : [],
    layout: defaultLayout,
    ...params,
  };
  const { query, onTagAdd } = useSearchQuery(queryParams, updateLocation);

  const {
    results,
    loading,
    onToggleSection,
    onRefreshSection,
    fileArray,
    resetFile,
    assignFile,
    arrangeResult,
    arrangeDashboard,
  } = useManageDashboards(query, {}, folder);

  return (
    <div className="sidemenu__top">
      <TopSectionItem link={searchLink} onClick={onOpenSearch} />
      {mainLinks.map((link, index) => {
        return <TopSectionItem link={link} key={`${link.id}-${index}`} />;
      })}
      <SearchResultsCustom
        results={results}
        loading={loading}
        onTagSelected={onTagAdd}
        editable={false}
        onToggleSection={onToggleSection}
        onRefreshSection={onRefreshSection}
        layout={query.layout}
        fileArray={fileArray}
        resetFile={resetFile}
        assignFile={assignFile}
        arrangeResult={arrangeResult}
        arrangeDashboard={arrangeDashboard}
      />
    </div>
  );
};

export default TopSection;
