/* eslint-disable react/display-name */
import React, { memo, useEffect } from 'react';
import { css, cx } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { stylesFactory, useTheme } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import { FileSection } from './FileSection';
import { SearchItem } from './SearchItem';
import { SectionHeader } from './SectionHeader';

export const RenderFolders = memo((props: any) => {
  // props
  const resetFile: any = props.resetFile;
  // const assignFile: any = props.assignFile;
  const fileArray: any = props.fileArray;
  const results: any = props.results;
  //
  const itemProps: any = props.itemProps;
  const onToggleSection: any = props.onToggleSection;
  const onToggleChecked: any = props.onToggleChecked;
  const editable: any = props.editable;
  const sectionLabel: any = props.sectionLabel;
  const itemsLabel: any = props.itemsLabel;
  //
  const moveUpFolder: any = props.moveUpFolder;
  const moveDownFolder: any = props.moveDownFolder;
  const moveUpDash: any = props.moveUpDash;
  const moveDownDash: any = props.moveDownDash;
  const arrangeResult: any = props.arrangeResult;
  const arrangeDashboard: any = props.arrangeDashboard;
  //
  const theme = useTheme();
  const styles = getSectionStyles(theme);
  //
  const general = results.filter((element: any) => element?.title === 'General');
  const uid = results.filter((element: any) => element?.title !== 'General').map((item: any) => item?.uid);

  const moveUpToDash = (item: any) => {
    moveUpDash(item);
  };

  const moveDownToDash = (item: any) => {
    moveDownDash(item);
  };

  useEffect(() => {
    if (uid.length >= 1 && uid[0] != null) {
      if (!resetFile && (!arrangeResult || !arrangeDashboard)) {
      } else {
        getBackendSrv()
          .post('/fileload', { uid })
          .then((data) => {
            if (data?.uid.length >= 1) {
              let filename: any = data?.filename.map((file: any) =>
                file === '' || file === undefined || file === null ? 'None' : file
              );
              arrangeResult({
                order: data?.order,
                uidOrder: data?.uid,
                fileorder: data?.fileorder,
                files: filename,
              });
            }
          });
      }
    }
  }, []);
  return (
    <div className={styles.wrapper}>
      {fileArray?.length <= 0 || fileArray === undefined ? (
        <div className={styles.wrapper}>
          {results.map((section: any) => {
            return (
              <div aria-label={sectionLabel} className={styles.section} key={section.id || section.title}>
                <SectionHeader
                  onSectionClick={onToggleSection}
                  {...{ onToggleChecked, editable, section, moveUpFolder, moveDownFolder, results, arrangeDashboard }}
                />
                {section.expanded && (
                  <div aria-label={itemsLabel} className={styles.sectionItems}>
                    {section.items.map((item: any) => (
                      <SearchItem key={item.id} {...itemProps} item={item} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {fileArray.map((item: any, index: number) => {
            return (
              <div
                key={index}
                className={css`
                  margin-bottom: 8px;
                  border: 1px solid ${theme.colors.border2};
                `}
              >
                <FileSection
                  fileName={item}
                  results={results}
                  itemProps={itemProps}
                  onToggleSection={onToggleSection}
                  onToggleChecked={onToggleChecked}
                  editable={editable}
                  sectionLabel={sectionLabel}
                  itemsLabel={itemsLabel}
                  moveUpFolder={moveUpFolder}
                  moveDownFolder={moveDownFolder}
                  moveUpToDash={moveUpToDash}
                  moveDownToDash={moveDownToDash}
                  arrangeResult={arrangeResult}
                  arrangeDashboard={arrangeDashboard}
                />
              </div>
            );
          })}
          {general.length > 0 ? (
            <div
              className={cx(
                styles.wrapper,
                css`
                  border: 1px solid ${theme.colors.border2};
                `
              )}
            >
              {general.map((section: any) => {
                return (
                  <div aria-label={sectionLabel} className={styles.section} key={section.id || section.title}>
                    <SectionHeader
                      onSectionClick={onToggleSection}
                      {...{
                        onToggleChecked,
                        editable,
                        section,
                        results,
                        moveUpFolder,
                        moveDownFolder,
                        arrangeDashboard,
                      }}
                    />
                    {section.expanded && (
                      <div aria-label={itemsLabel} className={styles.sectionItems}>
                        {section.items.map((item: any) => (
                          <SearchItem
                            key={item?.id}
                            {...itemProps}
                            item={item}
                            moveUpToDash={moveUpToDash}
                            moveDownToDash={moveDownToDash}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div></div>
          )}
        </>
      )}
    </div>
  );
});

const getSectionStyles = stylesFactory((theme: GrafanaTheme) => {
  const { md } = theme.spacing;
  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
    `,
    section: css`
      display: flex;
      flex-direction: column;
      background: ${theme.colors.panelBg};
    `,
    sectionItems: css`
      margin: 0 24px 0 32px;
    `,
    spinner: css`
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100px;
    `,
    resultsContainer: css`
      position: relative;
      flex-grow: 10;
      margin-bottom: ${md};
      background: ${theme.colors.bg1};
      // border: 1px solid ${theme.colors.border1};
      border-radius: 3px;
      height: 100%;
    `,
    noResults: css`
      padding: ${md};
      background: ${theme.colors.bg2};
      font-style: italic;
      margin-top: ${theme.spacing.md};
    `,
    listModeWrapper: css`
      position: relative;
      height: 100%;
      padding: ${md};
    `,
  };
});
