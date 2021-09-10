import React, { useRef, useState } from 'react';
import { css, cx } from 'emotion';
import { stylesFactory } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';

const TooltipEQ = (props: any) => {
  const item = props?.info;
  const EQName = item?.NAME;
  const equipment = props?.equipment;
  const check: boolean = props.type === 'MFAB2';
  const divDOM: any = useRef(null);
  const [isShow, setIsShow] = useState(false);

  const textColor: string = equipment[EQName]?.eqStatus
    ? equipment[EQName]?.eqStatus === 'Disconnection'
      ? '#d0d0d0'
      : '#2CA02C'
    : '#d0d0d0';

  const onMouseEnter = () => {
    setIsShow(true);
  };

  const onMouseLeave = () => {
    setIsShow(false);
  };

  const moveAndStore = (link: any, equipment: any) => {
    // localStorage.setItem('openDefault', JSON.stringify(equipment?.NAME));
    localStorage.setItem('openDefault', equipment?.NAME);
    // props.goEQInfo(link);
    const currentURL: any = window.location;
    location.replace(currentURL.origin + '/' + link);
  };

  const onClickLink = (e: any) => {
    if (item.FOLDID.length > 0) {
      getBackendSrv()
        .get('api/search', {
          folderIds: item.FOLDID[0],
        })
        .then((res: any) => {
          let link = res.length > 0 ? 'd/' + res[0].uid : 'home';
          res.forEach((dashboard: any) => {
            if (dashboard.title.indexOf('EQ') > -1) {
              link = 'd/' + dashboard.uid;
            }
          });
          moveAndStore(link, item);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const styles = getStyles('#ADB1B1', isShow);
  return (
    <>
      {check ? (
        <div onMouseLeave={onMouseLeave}>
          <div
            className={cx(
              styles.toolTip,
              css`
                position: absolute;
                z-index: 4;
                top: ${Number(item?.TOP) + 15}%;
                right: ${Number(item?.RIGHT - 5)}%;
              `
            )}
            ref={divDOM}
          >
            <div className={styles.titleText}>{item?.EQUIPMENT}</div>
            <div className={styles.content}>
              <span>EQ Status</span>
              <span style={{ color: textColor }}>{equipment[EQName]?.eqStatus || 'N/A'}</span>
            </div>
            <div className={styles.content}>
              <span>Alarm Status</span>
              <span style={{ color: equipment[EQName]?.alarmStatus === 'Present' ? '#c50000' : textColor }}>
                {equipment[EQName]?.alarmStatus || 'N/A'}
              </span>
            </div>
            {/* <div className={styles.content}>
              <span>Running Time</span>
              <span>{equipment[EQName]?.runningTime || 'N/A'}</span>
            </div> */}
          </div>
          <img
            src={item?.IMG}
            className={cx(
              css`
                position: absolute;
                width: 9%;
                object-fit: contain;
                z-index: 3;
                top: ${item?.TOP}%;
                right: ${item?.RIGHT}%;
                // cursor: ${item?.LINK?.length === 0 ? 'default' : 'pointer'};
                cursor: ${item?.FOLDID?.length > 0 ? 'pointer' : 'default'};
              `
            )}
            // onClick={item?.LINK?.length === 0 ? () => console.log('Preparing') : () => moveAndStore(item?.LINK, item)}
            onClick={onClickLink}
            onMouseEnter={onMouseEnter}
          />
        </div>
      ) : (
        <div onMouseLeave={onMouseLeave}>
          <div
            className={cx(
              styles.toolTip,
              css`
                position: absolute;
                z-index: 4;
                top: ${Number(item?.TOP) + 23}%;
                left: ${Number(item?.LEFT) + 2}%;
              `
            )}
            ref={divDOM}
          >
            <div className={styles.titleText}>{item?.EQUIPMENT}</div>
            <div className={styles.content}>
              <span>EQ Status</span>
              <span style={{ color: textColor }}>{equipment[EQName]?.eqStatus || 'N/A'}</span>
            </div>
            <div className={styles.content}>
              <span>Alarm Status</span>
              <span style={{ color: equipment[EQName]?.alarmStatus === 'Present' ? '#c50000' : textColor }}>
                {equipment[EQName]?.alarmStatus || 'N/A'}
              </span>
            </div>
            {/* <div className={styles.content}>
              <span>Running Time</span>
              <span>{equipment[EQName]?.runningTime || 'N/A'}</span>
            </div> */}
          </div>
          <img
            src={item?.IMG}
            className={cx(
              css`
                position: absolute;
                width: 20%;
                object-fit: contain;
                z-index: 3;
                top: ${item?.TOP}%;
                left: ${item?.LEFT}%;
                // cursor: ${item?.LINK?.length === 0 ? 'default' : 'pointer'};
                cursor: ${item?.FOLDID?.length > 0 ? 'pointer' : 'default'};
              `
            )}
            // onClick={item?.LINK?.length === 0 ? () => console.log('Preparing') : () => moveAndStore(item?.LINK, item)}
            onClick={onClickLink}
            onMouseEnter={onMouseEnter}
          />
        </div>
      )}
    </>
  );
};

const getStyles = stylesFactory((color, isShow) => {
  return {
    toolTip: css`
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      background-color: rgb(72, 72, 72);
      color: white;
      width: 15vw;
      min-width: 200px;
      min-height: 100px;
      padding: 15px;
      padding-bottom: 3px;
      opacity: 0.8;
      z-index: 4;
      display: ${isShow ? 'flex' : 'none'};
      transition: all 300ms ease-in-out;
    `,
    titleText: css`
      display: flex;
      justify-content: center;
      align-items: center;
      border-bottom: 1px solid white;
      margin-bottom: 8px;
      padding-bottom: 5px;
      padding-left: 50px;
      padding-right: 50px;
      font-weight: bold;
      text-align: center;
      font-size: 1vw;
    `,
    content: css`
      display: flex;
      justify-content: space-between;
      padding-left: 8px;
      padding-right: 8px;
      margin-bottom: 8px;
      font-weight: bold;
      font-size: 0.8vw;
    `,
    opacityControl: css`
      opacity: 0;
    `,
    titleTextTwo: css`
      display: flex;
      justify-content: center;
      align-items: center;
      border-bottom: 1px solid white;
      margin-bottom: 5px;
      padding-bottom: 5px;
      padding-left: 30px;
      padding-right: 30px;
      font-weight: bold;
      text-align: center;
      font-size: 1vw;
    `,
    contentTwo: css`
      display: flex;
      justify-content: space-between;
      padding-left: 8px;
      padding-right: 8px;
      font-weight: bold;
      font-size: 0.8vw;
    `,
  };
});

export default TooltipEQ;
