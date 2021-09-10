import React, { useEffect } from 'react';
import { css, cx } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { stylesFactory, useTheme } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import { FileSectionCustom } from './FileSectionCustom';
import { SearchItemCustom } from './SearchItemCustom';
import { SectionHeaderCustom } from './SectionHeaderCustom';

export const RenderFoldersCustom = (props: any) => {
  // props
  const resetFile: any = props.resetFile;
  // const assignFile: any = props.assignFile;
  const fileArray: any = props.fileArray;
  const results: any = props.results;
  //
  const itemProps: any = props.itemProps;
  const onToggleSection: any = props.onToggleSection;
  const onToggleChecked: any = props.onToggleChecked;
  const onRefreshSection: any = props.onRefreshSection;

  const editable: any = props.editable;
  const sectionLabel: any = props.sectionLabel;
  const itemsLabel: any = props.itemsLabel;
  const general = results.filter((element: any) => element?.title === 'General');
  //
  const arrangeResult: any = props.arrangeResult;
  const arrangeDashboard: any = props.arrangeDashboard;
  //
  const theme = useTheme();
  const styles = getSectionStyles(theme);
  const uid = results.filter((element: any) => element.title !== 'General').map((item: any) => item.uid);

  const _setTimer = (sec: number) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, sec);
    });
  };

  const loadFileName = async () => {
    await _setTimer(800);
    try {
      let res: any = await getBackendSrv().post('/fileload', { uid });
      if (res.uid.length >= 1) {
        let filename: any = res?.filename.map((file: any) => (file === '' || file === undefined ? 'None' : file));
        arrangeResult({
          order: res?.order,
          uidOrder: res?.uid,
          fileorder: res?.fileorder,
          files: filename,
        });
      }
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  useEffect(() => {
    if (!resetFile && (!arrangeResult || !arrangeDashboard)) {
    } else {
      loadFileName().then((res: any) => {
        if (!res) {
          loadFileName();
        }
      });
    }
  }, []);

  return (
    <div className={styles.wrapper}>
      {fileArray?.length === 0 ? (
        <div></div>
      ) : (
        <>
          {fileArray.map((item: any, index: number) => {
            return (
              <div
                key={index}
                className={css`
                  margin-bottom: 3px;
                  border: 1px solid ${theme.colors.border2};
                `}
              >
                <FileSectionCustom
                  fileName={item}
                  results={results}
                  itemProps={itemProps}
                  onToggleSection={onToggleSection}
                  onToggleChecked={onToggleChecked}
                  onRefreshSection={onRefreshSection}
                  editable={editable}
                  sectionLabel={sectionLabel}
                  itemsLabel={itemsLabel}
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
                    <SectionHeaderCustom
                      onSectionClick={onToggleSection}
                      check={false}
                      {...{ onToggleChecked, editable, section, results, arrangeDashboard }}
                    />
                    {section.expanded && (
                      <div aria-label={itemsLabel} className={styles.sectionItems}>
                        {section.items.map((item: any) => (
                          <SearchItemCustom
                            key={item?.id}
                            {...itemProps}
                            item={item}
                            onRefreshSection={onRefreshSection}
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
};

const getSectionStyles = stylesFactory((theme: GrafanaTheme) => {
  const { md } = theme.spacing;
  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
      background-color: ${theme.colors.bg2};
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
      /* border: 1px solid ${theme.colors.border1}; */
      border-radius: 3px;
    `,
    noResults: css`
      padding: ${md};
      background: ${theme.palette.gray15};
      font-style: italic;
      margin-top: ${theme.spacing.md};
    `,
    listModeWrapper: css`
      position: relative;
      height: 100%;
      padding: ${md};
    `,
    section: css`
      display: flex;
      flex-direction: column;
      background: ${theme.colors.panelBg};
    `,
    sectionItems: css`
      padding-top: 8px;
      padding-left: 8px;
      padding-right: 8px;
    `,
  };
});
