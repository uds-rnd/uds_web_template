import React, { memo, useEffect, useState } from 'react';
import { css, cx } from 'emotion';
import { stylesFactory, Icon, Modal, ConfirmModal } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import DashboardEdit from './DashboardEdit';

const connect_color: any = '#2CA02C';
const connect_img: any = 'public/img/OK.png';
const disconnect_color: any = '#767171';
const disconnect_img: any = 'public/img/disconnect.png';
const loading_img: any = 'public/img/loading.gif';
const none_img: any = 'public/img/plus.png';

const EquipmentCard: any = ({ data, color, isadmin }: any) => {
  const fixwidth: number = window.outerWidth;
  const width_resize: number = Math.floor(fixwidth / 100);

  const styles = cardStyles(color, fixwidth, width_resize);
  const [linkUrl, setLinkUrl] = useState<any>('');
  const [isOpenEdit, setIsOpenEdit] = useState<any>({
    open: false,
    mode: '',
  });
  const [isOpenAlert, setIsOpenAlert] = useState<any>(false);

  const textColor: any = data.loading
    ? disconnect_color
    : data.status.eqStatus === 'Disconnection'
    ? disconnect_color
    : connect_color;

  const connectImg: any = data.loading
    ? loading_img
    : data.status.eqStatus === 'Disconnection'
    ? disconnect_img
    : connect_img;

  const searchUrl = () => {
    if (data.id !== undefined) {
      getBackendSrv()
        .get('api/search', {
          folderIds: data.id,
        })
        .then((res: any) => {
          let link = res.length > 0 ? 'd/' + res[0].uid : 'home';
          res.forEach((dashboard: any) => {
            if (dashboard.title.indexOf('EQ') > -1) {
              link = 'd/' + dashboard.uid;
            }
          });
          setLinkUrl(link);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const deleteData = () => {
    setIsOpenAlert(false);
    getBackendSrv()
      .post('pythonCmd', {
        Table: 'data_source',
        Fab: data.fileName,
        EqType: data.eqtype,
        EqName: data.title,
        IO: 'OUT',
        Stage: data.stage,
        IP: data.ip,
        ID: data.datasourceId,
      })
      .then((res: any) => {
        data.onReflash();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const moveDashboard = () => {
    console.log(data);
    localStorage.setItem('openFile', data.fileName);
    // localStorage.setItem('openFile', JSON.stringify(data.fileName));
    // localStorage.setItem('openDefault', JSON.stringify(data.title));
    localStorage.setItem('openDefault', data.title);
    location.replace(window.location.origin + '/' + linkUrl);
  };

  const DashboardCard: any = () => {
    return (
      <div
        className={cx(
          styles.cardRoot,
          css`
            // cursor: ${textColor === disconnect_color ? 'default' : 'pointer'};
            cursor: pointer;
          `
        )}
        onClick={moveDashboard}
      >
        <div className={cx(styles.cardside)}>
          <div>
            <br />
            <p className={cx(styles.fontside)}>{data.fileName}</p>
          </div>
          <div>
            <p
              className={cx(
                styles.fontside,
                css`
                  font-size: 0.7em;
                  font-weight: 500;
                `
              )}
            >
              {data.stage ? data.stage.toUpperCase() : null}
            </p>
          </div>
        </div>
        <div className={cx(styles.cardbody)}>
          <div
            className={css`
              width: 100%;
              height: 40%;
              display: flex;
              justify-content: center;
              align-items: center;
            `}
          >
            <img
              className={css`
                width: ${fixwidth < 1280 ? '50px' : width_resize * 3 + 'px'};
              `}
              src={connectImg}
              alt="ok"
            />
            <p
              className={css`
                color: ${textColor};
                font-size: 1.4em;
                font-weight: bolder;
                margin: 8px 0px 8px 10px;
              `}
            >
              {data.title}
            </p>
          </div>
          <div
            className={css`
              width: 100%;
              height: 60%;
              font-size: 0.85em;
              display: flex;
              flex-direction: column;
              // justify-content: space-between;
              justify-content: center;
            `}
          >
            <div className={cx(styles.statusInfo)}>
              <p>EQ Status</p>
              <p
                className={css`
                  color: ${textColor};
                `}
              >
                {data.status.eqStatus}
              </p>
            </div>
            <div className={cx(styles.statusInfo)}>
              <p>Alarm Status</p>
              <p
                className={css`
                  color: ${data.status.alarmStatus === 'Present' ? '#c50000' : textColor};
                `}
              >
                {data.status.alarmStatus}
              </p>
            </div>
            {/* <div
              className={cx(
                styles.statusInfo,
                css`
                  font-size: 0.9em;
                `
              )}
            >
              <p>Running Time</p>
              <p
                className={css`
                  color: ${textColor};
                `}
              >
                {data.status.runningTime}
              </p>
            </div> */}
          </div>
        </div>
      </div>
    );
  };

  const EmptyCard: any = () => {
    return (
      <div className={cx(styles.cardRoot)}>
        <div className={cx(styles.cardside)}>
          <div>
            <br />
            <p className={cx(styles.fontside)}>{data.fileName}</p>
          </div>
          <div>
            <p
              className={cx(
                styles.fontside,
                css`
                  font-size: 0.7em;
                  font-weight: 500;
                `
              )}
            >
              {data.stage ? data.stage.toUpperCase() : null}
            </p>
          </div>
        </div>
        <div
          className={cx(
            styles.cardbody,
            css`
              display: flex;
              justify-content: center;
              align-items: center;
              cursor: pointer;
            `
          )}
          onClick={() => (isadmin ? setIsOpenEdit({ open: true, mode: 'IN' }) : null)}
        >
          <img src={none_img} style={{ width: fixwidth < 1280 ? '85px' : width_resize * 5 + 'px' }} />
        </div>
      </div>
    );
  };

  useEffect(() => {
    searchUrl();
  }, [data]);

  return (
    <div style={{ margin: width_resize * 0.3 + 'px' }}>
      {isadmin && (
        <>
          {data.title ? (
            <div className={cx(styles.cardEditdiv)}>
              <div className={cx(styles.editIcon)} onClick={() => setIsOpenEdit({ open: true, mode: 'UPDATE' })}>
                <Icon name="edit" size="xs" />
              </div>
              <div
                className={cx(
                  styles.editIcon,
                  css`
                    background-color: #9b0000;
                  `
                )}
                onClick={() => setIsOpenAlert(true)}
              >
                <Icon name="times" size="xs" />
              </div>
            </div>
          ) : (
            <div className={cx(styles.cardEditdiv)} />
          )}
        </>
      )}
      {data.title ? <DashboardCard /> : <EmptyCard />}
      <Modal
        title={
          <div className="modal-header-title">
            <Icon name="edit" size="lg" />
            <span className="p-l-1">Equipment Setting</span>
          </div>
        }
        isOpen={isOpenEdit.open}
        onDismiss={() => setIsOpenEdit({ open: false })}
      >
        <DashboardEdit data={data} mode={isOpenEdit.mode} setIsOpenEdit={setIsOpenEdit} deleteData={deleteData} />
      </Modal>
      <ConfirmModal
        isOpen={isOpenAlert}
        title="Delete Equipment Data"
        body={<span>Are you sure you want delete Equipment Data?</span>}
        confirmText="YES"
        icon="info-circle"
        onConfirm={deleteData}
        onDismiss={() => setIsOpenAlert(false)}
      />
    </div>
  );
};

const cardStyles = stylesFactory((color: any, fixwidth: number, width_resize: number) => {
  return {
    cardRoot: css`
      height: ${fixwidth < 1280 ? '170px' : width_resize * 11 + 'px'};
      width: fit-content;
      min-width: ${fixwidth < 1280 ? '250px' : width_resize * 17 + 'px'};
      background-color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 2px solid ${color};
      border-radius: 1vh;
      font-size: ${fixwidth < 1280 ? '18px' : width_resize * 1.2 + 'px'};
      overflow: hidden;
    `,
    cardEditdiv: css`
      width: 100%;
      height: 25px;
      display: flex;
      justify-content: flex-end;
    `,
    editIcon: css`
      width: 21px;
      height: 21px;
      background-color: #353535;
      color: #dbdbdb;
      border-radius: 50%;
      margin-left: 3px;
      text-align: center;
      cursor: pointer;
    `,
    cardside: css`
      width: fit-content;
      min-width: ${fixwidth < 1280 ? '80px' : width_resize * 4 + 'px'};
      background-color: ${color};
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    `,
    fontside: css`
      color: white;
      font-weight: bolder;
      word-break: break-all;
    `,
    cardbody: css`
      width: fit-content;
      min-width: ${fixwidth < 1280 ? '170px' : width_resize * 12 + 'px'};
      height: 100%;
      margin: 2px;
    `,
    statusInfo: css`
      color: ${color};
      font-weight: bold;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1%;
      p {
        margin: 0px;
      }
    `,
  };
});

export default memo(EquipmentCard);
