import React, { FC, memo, useEffect, useState } from 'react';
import { css } from 'emotion';
import {
  HorizontalGroup,
  stylesFactory,
  useTheme,
  Spinner,
  Modal,
  Icon,
  Label,
  Select,
  Badge,
  Button,
  Input,
} from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';
import { contextSrv } from 'app/core/services/context_srv';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import { FilterInput } from 'app/core/components/FilterInput/FilterInput';
import { FolderDTO } from 'app/types';
import { useManageDashboards } from '../hooks/useManageDashboards';
import { SearchLayout } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { MoveToFolderModal } from './MoveToFolderModal';
import { useSearchQuery } from '../hooks/useSearchQuery';
import { SearchResultsFilter } from './SearchResultsFilter';
import { SearchResults } from './SearchResults';
import { DashboardActions } from './DashboardActions';
import { connectWithRouteParams, ConnectProps, DispatchProps } from '../connect';
import { getBackendSrv } from '@grafana/runtime';

export interface Props {
  folder?: FolderDTO;
}

const { isEditor } = contextSrv;

export const ManageDashboards: FC<Props & ConnectProps & DispatchProps> = memo(({ folder, params, updateLocation }) => {
  const folderId = folder?.id;
  const folderUid = folder?.uid;
  const theme = useTheme();
  const styles = getStyles(theme);
  const defaultLayout = folderId ? SearchLayout.List : SearchLayout.Folders;
  const queryParams = {
    skipRecent: true,
    skipStarred: true,
    folderIds: folderId ? [folderId] : [],
    layout: defaultLayout,
    ...params,
  };
  const {
    query,
    hasFilters,
    onQueryChange,
    onTagFilterChange,
    onStarredFilterChange,
    onTagAdd,
    onSortChange,
    onLayoutChange,
  } = useSearchQuery(queryParams, updateLocation);

  const {
    results,
    loading,
    initialLoading,
    canSave,
    allChecked,
    hasEditPermissionInFolders,
    canMove,
    canDelete,
    onToggleSection,
    onToggleChecked,
    onToggleAllChecked,
    onDeleteItems,
    onMoveItems,
    noFolders,
    // testRedux,
    addFile,
    deleteFile,
    assignFile,
    resetFile,
    fileArray,
    moveUpFolder,
    moveDownFolder,
    moveUpDash,
    moveDownDash,
    arrangeResult,
    arrangeDashboard,
  } = useManageDashboards(query, {}, folder);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectValue, setSelectValue] = useState<any>([]);

  const onMoveTo = () => {
    setIsMoveModalOpen(true);
  };

  const onItemDelete = () => {
    setIsDeleteModalOpen(true);
  };

  if (initialLoading) {
    return <Spinner className={styles.spinner} />;
  }

  if (noFolders && !hasFilters) {
    return (
      <EmptyListCTA
        title="This folder doesn't have any dashboards yet"
        buttonIcon="plus"
        buttonTitle="Create Dashboard"
        buttonLink={`dashboard/new?folderId=${folderId}`}
        proTip="Add/move dashboards to your folder at ->"
        proTipLink="dashboards"
        proTipLinkTitle="Manage dashboards"
        proTipTarget=""
      />
    );
  }

  const plusFile = (event: any) => {
    if (fileArray.includes(event.target.value)) {
      return;
    }
    if (event.code === 'Enter' && event.target.value !== '') {
      addFile(event.target.value);
      event.target.value = '';
    } else {
      return;
    }
  };

  const minusFile = (event: any) => {
    deleteFile(event.target.innerText);
  };

  const reflectResult = () => {
    const resultFolder: any = results
      .filter((result) => result.title !== 'General')
      .map((result: any) => ({
        label: result.files,
      }));
    const newSelect: any = selectValue.length < resultFolder.length ? resultFolder : selectValue;
    const answerSelect: any = newSelect.map((item: any) => item.label);
    // if (answerSelect.length < results.filter((element) => element.title !== 'General').length) {
    //   alert('모든 대시보드에 파일을 할당해 주십시요.');
    //   return;
    // }
    assignFile(answerSelect);
    const title = results
      .filter((element) => element.title !== 'General')
      .map((item: any) => {
        return item.title.toLowerCase();
      });
    const filename = answerSelect;
    const uid = results.filter((element) => element.title !== 'General').map((item: any) => item.uid);

    let newJson: any = {};
    fileArray.forEach((element: any, index: number) => {
      newJson[element] = index;
    });

    const fileorder = filename.map((element: any, index: number) => {
      return newJson[element];
    });
    setIsFileModalOpen(false);
    getBackendSrv()
      .post('/filesave', { title, filename, uid, fileorder })
      .then(() => {
        location.replace(location.pathname);
      });
  };

  const onChangeFileName = (idx: any) => (e: any) => {
    if (selectValue.length <= idx) {
      const initSelectValue: any = results
        .filter((result: any) => result.title !== 'General')
        .map((result: any, idx: any) => ({
          label: result.files,
          value: idx,
        }));

      initSelectValue[idx] = e;
      setSelectValue(initSelectValue);
    } else {
      const _selectValue: any = selectValue.slice();
      _selectValue[idx] = e;
      setSelectValue(_selectValue);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <HorizontalGroup justify="space-between">
          <FilterInput
            labelClassName="gf-form--has-input-icon"
            inputClassName="gf-form-input width-20"
            value={query.query}
            onChange={onQueryChange}
            placeholder={'Search dashboards by name'}
          />
          <DashboardActions
            isEditor={isEditor}
            canEdit={hasEditPermissionInFolders || canSave}
            folderId={folderId}
            fileState={isFileModalOpen}
            fileModal={setIsFileModalOpen}
          />
        </HorizontalGroup>
      </div>

      <div className={styles.results}>
        <SearchResultsFilter
          allChecked={allChecked}
          canDelete={hasEditPermissionInFolders && canDelete}
          canMove={hasEditPermissionInFolders && canMove}
          deleteItem={onItemDelete}
          moveTo={onMoveTo}
          onToggleAllChecked={onToggleAllChecked}
          onStarredFilterChange={onStarredFilterChange}
          onSortChange={onSortChange}
          onTagFilterChange={onTagFilterChange}
          query={query}
          hideLayout={!!folderUid}
          onLayoutChange={onLayoutChange}
          editable={hasEditPermissionInFolders}
        />
        <SearchResults
          loading={loading}
          assignFile={assignFile}
          fileArray={fileArray}
          resetFile={resetFile}
          results={results}
          editable={hasEditPermissionInFolders}
          onTagSelected={onTagAdd}
          onToggleSection={onToggleSection}
          onToggleChecked={onToggleChecked}
          layout={query.layout}
          moveUpFolder={moveUpFolder}
          moveDownFolder={moveDownFolder}
          moveUpDash={moveUpDash}
          moveDownDash={moveDownDash}
          arrangeResult={arrangeResult}
          arrangeDashboard={arrangeDashboard}
        />
      </div>
      <ConfirmDeleteModal
        onDeleteItems={onDeleteItems}
        results={results}
        isOpen={isDeleteModalOpen}
        onDismiss={() => setIsDeleteModalOpen(false)}
      />
      <MoveToFolderModal
        onMoveItems={onMoveItems}
        results={results}
        isOpen={isMoveModalOpen}
        onDismiss={() => setIsMoveModalOpen(false)}
      />
      <Modal
        title={
          <div className="modal-header-title">
            <Icon name="edit" size="lg" />
            <span className="p-l-1">Creating File</span>
          </div>
        }
        isOpen={isFileModalOpen}
        onDismiss={() => setIsFileModalOpen(false)}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            margin-bottom: 1em;
          `}
        >
          {fileArray.map((smallItem: any, idx: number) => {
            return <Badge key={idx} text={smallItem} color={'blue'} onClick={minusFile} />;
          })}
          <div>
            <Input prefix={<Icon name="line-alt" />} onKeyPress={plusFile} />
          </div>
        </div>
        <div
          className={css`
            display: flex;
            flex-direction: column;
          `}
        >
          {results
            .filter((element) => element?.title !== 'General')
            .map((item, index) => {
              return (
                <div
                  key={index}
                  className={css`
                    margin-bottom: 1em;
                  `}
                >
                  <Label>{item?.title}</Label>
                  <Select
                    options={fileArray.map((smallItem: any, idx: number) => {
                      return {
                        label: smallItem,
                        value: idx,
                      };
                    })}
                    value={
                      selectValue.length <= index
                        ? {
                            label: item.files,
                            value: index,
                          }
                        : selectValue[index]
                    }
                    onChange={onChangeFileName(index)}
                  />
                </div>
              );
            })}
          <div
            className={css`
              width: 30%;
            `}
          >
            <Button onClick={reflectResult}>Assign</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default connectWithRouteParams(ManageDashboards);

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      height: 100%;
    `,
    results: css`
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      margin-top: ${theme.spacing.xl};
    `,
    spinner: css`
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    `,
  };
});
