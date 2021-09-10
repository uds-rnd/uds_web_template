import React, { FC, memo, useEffect, useState } from 'react';
import { css, cx } from 'emotion';
import { stylesFactory, Button, Icon, LoadingPlaceholder, Input, Tag, ConfirmModal, Alert } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import { colorsArr } from './util';

const SettingPage: any = ({ data, onClose, onRefresh, eqType }: any) => {
  const styles = getStyles();
  const [fabList, setFabList] = useState<any>({});
  const [isOpenAlert, setIsOpenAlert] = useState<any>(false);
  const [isloading, setIsloading] = useState<any>({ idx: 0, msg: '' });

  const onClickIcon = (mode: any, key: any) => (e: any) => {
    if (mode === 'plus') {
      fabList[key].count++;
    } else if (mode === 'minus') {
      if (fabList[key].count > 1) {
        fabList[key].count--;
      }
    } else {
      fabList[key].count = 0;
    }
    setFabList({ ...fabList });
  };

  const addTagList = (e: any) => {
    if (e.code === 'Enter') {
      if (e.target.value.length > 0) {
        let newTag: any = e.target.value;
        if (fabList[newTag]) {
          fabList[newTag].count = 5;
        } else {
          fabList[newTag] = {
            item: [],
            color: ['', colorsArr[1][Object.entries(fabList).length % 6]],
            count: 5,
          };
        }
        setFabList({ ...fabList });
      }
      e.target.value = '';
    }
  };

  const changefabNumber = (key: any) => (e: any) => {
    const regex: any = /^[0-9]*$/;
    if (regex.test(e.target.value)) {
      fabList[key].count = parseInt(e.target.value, 10);
      setFabList({ ...fabList });
    }
  };

  const checkUseEq = () => {
    let uesEq = [];
    for (let key in fabList) {
      if (fabList[key].item.length > 0) {
        if (fabList[key].item.length > fabList[key].count) {
          for (let i = fabList[key].count; i < fabList[key].item.length; i++) {
            if (fabList[key].item[i].title) {
              uesEq.push(key + ':' + fabList[key].item[i].title);
            }
          }
        }
      }
    }
    return uesEq;
  };

  const changeDatasouce = async () => {
    setIsOpenAlert(false);
    setIsloading({ idx: 1, msg: '' });

    const eqTypeList = eqType.split(',').map((type: any) => type.replaceAll(' ', ''));
    const useEqList = checkUseEq();
    let ErrMsg = [];
    if (useEqList.length > 0) {
      ErrMsg.push('There is equipment in use. [' + String(useEqList) + ']');
    } else {
      for (let key in fabList) {
        let idx_st = 0;
        let idx_ed = fabList[key].count - 1;
        let IO = 'IN';

        if (fabList[key].item.length > 0) {
          if (fabList[key].item.length > fabList[key].count) {
            idx_st = fabList[key].count;
            idx_ed = fabList[key].item.length - 1;
            IO = 'DELETE';
          } else if (fabList[key].item.length < fabList[key].count) {
            idx_st = fabList[key].item.length;
          } else {
            continue;
          }
        }

        for (let j = idx_st; j <= idx_ed; j++) {
          let _id = '';
          if (IO === 'DELETE') {
            _id = fabList[key].item[j].datasourceId;
          }
          try {
            let res: any = await getBackendSrv().post('pythonCmd', {
              Table: 'data_source',
              Fab: key,
              EqType: '',
              EqName: '',
              IO: IO,
              Stage: '',
              IP: '',
              ID: _id,
            });
          } catch (err) {
            console.log(err);
            ErrMsg.push(String(err));
          }
        }
      }
    }

    if (ErrMsg.length > 0) {
      setIsloading({ idx: 3, msg: String(ErrMsg) });
    } else {
      setIsloading({ idx: 2, msg: '' });
    }

    onRefresh();
    setTimeout(() => {
      setIsloading(0);
    }, 2000);
  };

  useEffect(() => {
    for (let key in data) {
      if (data[key].length > 0) {
        fabList[key] = {
          color: data[key][0].color,
          item: data[key].map((i: any) => i),
          count: data[key].length,
        };
      }
    }
    setFabList({ ...fabList });
  }, []);

  return (
    <div className={cx(styles.rootbox)}>
      {isloading.idx === 1 && <LoadingPlaceholder text="Loading.." />}
      {isloading.idx === 2 && <Alert title="Update Successful" severity="success" />}
      {isloading.idx === 3 && <Alert title={isloading.msg} severity="error" />}
      <div style={{ margin: '0 10px 0 10px' }}>
        <div className={cx(styles.flexdivCenter)}>
          <Input onKeyPress={addTagList} placeholder="Input FAB NAME and Press Enter Key" width={50} />
        </div>
        {Object.entries(fabList).map((item: any, idx: any) => {
          if (item[1].count === 0) {
            return null;
          }
          return (
            <div key={'fablistdiv' + idx} className={cx(styles.flexdivCenter)}>
              <Tag
                name={item[0]}
                style={{
                  fontSize: '15px',
                  color: 'white',
                  backgroundColor: item[1].color && item[1].color.length >= 2 ? item[1].color[1] : 'gray',
                }}
              />
              &nbsp;&nbsp;&nbsp;&nbsp;
              <Icon name="minus-circle" onClick={onClickIcon('minus', item[0])} style={{ cursor: 'pointer' }} />
              &nbsp;&nbsp;
              <Input onChange={changefabNumber(item[0])} value={item[1].count} width={10} /> &nbsp;&nbsp;
              <Icon name="plus-circle" onClick={onClickIcon('plus', item[0])} style={{ cursor: 'pointer' }} />
              &nbsp;&nbsp;&nbsp;&nbsp;
              <Icon name="trash-alt" onClick={onClickIcon('trash', item[0])} style={{ cursor: 'pointer' }} />
            </div>
          );
        })}
      </div>
      <div
        className={cx(
          styles.flexdivCenter,
          css`
            justify-content: center;
          `
        )}
      >
        <Button size="md" variant="primary" onClick={() => setIsOpenAlert(true)}>
          UPDATE
        </Button>
        &nbsp;&nbsp;
        <Button size="md" variant="destructive" onClick={() => onClose(false)}>
          CANCEL
        </Button>
      </div>
      <ConfirmModal
        isOpen={isOpenAlert}
        title="Remove Fab Data"
        body={<span>Are you sure you want Change FAB Setting?</span>}
        confirmText="YES"
        icon="info-circle"
        onConfirm={changeDatasouce}
        onDismiss={() => setIsOpenAlert(false)}
      />
    </div>
  );
};

const getStyles = stylesFactory(() => {
  return {
    rootbox: css`
      height: fit-content;
      margin: 5px;
    `,
    flexdivCenter: css`
      width: 100%;
      height: fit-content;
      margin: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    `,
    flexdivleft: css`
      width: 100%;
      margin: 10px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
    `,
    flexboxhalf: css`
      flex: 1 1;
    `,
    labeldiv: css`
      width: 40%;
      margin: 5px 30px 5px 10px;
      font-size: 20px;
      font-weight: 600;
      // background-color: #5393ff;
      // color: white;
      // border-radius: 10px;
    `,
  };
});

export default memo(SettingPage);
