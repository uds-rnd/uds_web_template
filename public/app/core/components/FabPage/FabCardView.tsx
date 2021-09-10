import React, { FC, useEffect, useState } from 'react';
import { css, cx } from 'emotion';
import { stylesFactory, Button, LinkButton, Modal, Icon } from '@grafana/ui';
import { config, getBackendSrv } from '@grafana/runtime';
import { Branding } from '../Branding/Branding';
import { useSelector } from 'react-redux';

import EquipmentCard from './EquipmentCard';
import SettingPage from './SettingPage';
import { query, initFolderlist, statusapi } from './util';

export const FabCardView: FC = (props: any) => {
  const styles = getStyles(config.theme);
  const [fablist, setFablist] = useState<any>({});
  const [selectList, setSelectList] = useState<any>('');
  const [isOpenSetting, setIsOpenSetting] = useState(false);

  const id = useSelector((state: any) => state.location.routeParams.id);
  // const isadmin = config.bootData.user.orgRole === 'Admin' && id === 'All';
  const isadmin = config.bootData.user.orgRole === 'Admin';

  const eqType: any = config.datasources.Setting ? config.datasources.Setting?.jsonData?.eqtype : '';

  const loadStatusInfo: any = async (folders: any) => {
    let _url: any =
      config.datasources.Setting && config.datasources.Setting.jsonData.fabUrl
        ? config.datasources.Setting.jsonData.fabUrl
        : 'Not Setting Url';

    for (let key in folders) {
      statusapi(_url, folders[key], key)
        .then((res: any) => {
          folders = {
            ...folders,
            [key]: res,
          };
          setFablist(folders);
        })
        .catch((err: any) => {
          console.log(err);
        });
    }
  };

  const searchFolder = async () => {
    let datasources: any = await getBackendSrv().get('api/datasources');
    datasources = datasources.filter((db: any) => db.type === 'influxdb');
    let fold_arr: any, file_arr: any;
    try {
      let res: any = await getBackendSrv().get('api/search', query);
      fold_arr = res.filter((fold: any) => fold.type === 'dash-folder');
      file_arr = await getBackendSrv().post('fileload', { uid: fold_arr.map((fold: any) => fold.uid) });
    } catch (err) {
      console.log(err);
      return false;
    }

    let file_obj: any = initFolderlist(datasources, fold_arr, file_arr, eqType, id);
    for (let key in file_obj) {
      file_obj[key] = file_obj[key].map((item: any) => {
        item.onReflash = searchFolder;
        return item;
      });
    }
    setFablist(file_obj);
    loadStatusInfo(file_obj);
    return true;
  };

  const repeatSearch = async () => {
    let res: any = await searchFolder();
    if (!res) {
      await searchFolder();
    }
    setSelectList(id);
  };

  useEffect(() => {
    repeatSearch();
  }, []);

  return (
    <div className={styles.fabViewBg}>
      <div className={cx(styles.fabheader)}>
        <div className={cx(styles.fabLogodiv)}>
          <Branding.LoginLogo className={cx(styles.fabLogo)} />
          <Button
            className={cx(styles.fabNaviBtn)}
            icon="home-alt"
            size="lg"
            variant="link"
            onClick={() => location.replace('/home')}
          >
            HOME
          </Button>
        </div>
        <div className={cx(styles.fabNavidiv)}></div>
        <div className={cx(styles.fabSettingdiv)}>
          <LinkButton
            className={cx(styles.fabNaviBtn)}
            icon="key-skeleton-alt"
            size="lg"
            variant="link"
            href="/logout"
            target="_self"
            rel="noopener"
          >
            SIGN OUT
          </LinkButton>
          {isadmin && (
            <Button
              className={cx(
                styles.fabNaviBtn,
                css`
                  float: right;
                `
              )}
              icon="cog"
              size="lg"
              variant="link"
              onClick={() => setIsOpenSetting(true)}
            >
              Setting
            </Button>
          )}
        </div>
      </div>
      <div className={cx(styles.fabwrapper)}>
        <div className={cx(styles.fabSelect)}>
          {id === 'All' && (
            <Button
              className={cx(
                styles.fabSelectBtn,
                css`
                  background-color: white;
                  color: black;
                `
              )}
              size="sm"
              variant="link"
              onClick={() => setSelectList('All')}
            >
              {'All'}
            </Button>
          )}
          {Object.entries(fablist).map((file: any, idx: any) => {
            if (file[0] === 'All') {
              return null;
            }
            if (file[1].length > 0) {
              return (
                <Button
                  key={'fabselect' + idx}
                  className={cx(
                    styles.fabSelectBtn,
                    css`
                      background-color: ${file[1][0].color[0]};
                      color: white;
                    `
                  )}
                  size="sm"
                  variant="link"
                  onClick={() => setSelectList(file[0])}
                >
                  {file[0]}
                </Button>
              );
            }
            return null;
          })}
        </div>
        <div className={styles.fabListwrap}>
          {Object.entries(fablist).map((file: any, fileIdx: any) => {
            if (id === 'All') {
              if (selectList === 'All' || selectList === file[0]) {
                return (
                  <div key={'fabCard' + fileIdx}>
                    <div className={styles.fabListRow}>
                      {file[1].map((item: any, itemIdx: any) => (
                        <EquipmentCard
                          key={'EquipmentCard' + itemIdx}
                          data={item}
                          color={item.color[0]}
                          isadmin={isadmin}
                        />
                      ))}
                    </div>
                    <br />
                  </div>
                );
              }
            } else if (id !== 'All' && id === file[0]) {
              let mid: number = file[1].length >= 10 ? file[1].length / 2 : file[1].length;
              return (
                <div key={'fabCard' + fileIdx}>
                  <div className={styles.fabListRow}>
                    {file[1].map((item: any, itemIdx: any) => {
                      if (itemIdx >= mid) {
                        return null;
                      }
                      return (
                        <EquipmentCard
                          key={'EquipmentCard' + itemIdx}
                          data={item}
                          color={item.color[0]}
                          isadmin={isadmin}
                        />
                      );
                    })}
                  </div>
                  <br />
                  <div className={styles.fabListRow}>
                    {file[1].map((item: any, itemIdx: any) => {
                      if (itemIdx < mid) {
                        return null;
                      }
                      return (
                        <EquipmentCard
                          key={'EquipmentCard' + itemIdx}
                          data={item}
                          color={item.color[1]}
                          isadmin={isadmin}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
      <Modal
        title={
          <div className="modal-header-title">
            <Icon name="edit" size="lg" />
            <span className="p-l-1">FAB Setting</span>
          </div>
        }
        isOpen={isOpenSetting}
        onDismiss={() => setIsOpenSetting(false)}
      >
        <SettingPage data={fablist} onClose={setIsOpenSetting} onRefresh={searchFolder} eqType={eqType} />
      </Modal>
    </div>
  );
};

const getStyles = stylesFactory((theme) => {
  // const bgColor = theme.isDark ? theme.palette.black : theme.palette.white;
  return {
    fabViewBg: css`
      min-height: 100vh;
      background-color: #eeeff1;
      min-width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #464c54;
    `,
    fabwrapper: css`
      width: 100%;
      height: 90vh;
      margin: 5px;
      background-color: transparent;
      opacity: 0.9;
      overflow-y: auto;
    `,
    fabheader: css`
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      background-color: white;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.16);
    `,
    fabLogodiv: css`
      height: 60px;
      margin-left: 30px;
      display: flex;
      justify-content: left;
      align-items: center;
      flex-basis: 15%;
    `,
    fabLogo: css`
      height: 50px;
      margin-right: 20px;
    `,
    fabNavidiv: css`
      height: 60px;
      flex-basis: auto;
      display: flex;
      justify-content: center;
      align-items: center;
    `,
    fabSettingdiv: css`
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: right;
      flex-basis: auto;
    `,
    fabNaviBtn: css`
      font-size: 16px;
      font-weight: bolder;
      margin: 0 5px 0 5px;
      border: none;
      background-color: transparent;
      height: 100%;
      color: #646464;
    `,
    fabSelect: css`
      width: 100%;
      height: 70px;
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    fabSelectBtn: css`
      font-size: 14px;
      margin: 2px 5px 2px 5px;
      padding: 10px 15px 10px 15px;
      border: none;
      height: fit-content;
      color: white;
    `,
    fabListwrap: css`
      margin: 5px;
    `,
    fabListRow: css`
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      margin: 10px 1px 10px 1px;
    `,
  };
});
