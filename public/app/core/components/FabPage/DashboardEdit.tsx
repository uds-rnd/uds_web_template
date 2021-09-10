import React, { memo, useEffect, useState } from 'react';
import { css, cx } from 'emotion';
import { stylesFactory, Tag, Input, Button, Select, ConfirmModal, Alert } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';

const DashboardEdit: any = ({ data, mode, setIsOpenEdit, deleteData, onRefresh }: any) => {
  const styles = cardStyles();
  const [isOpenAlert, setIsOpenAlert] = useState<any>(false);
  const [isAlert, setIsAlert] = useState<any>(false);
  const [inputData, setInputData] = useState({
    name: '',
    type: '',
    typeOption: [],
    stage: '',
    ip: '',
  });

  const onChangeData = (key: any) => (e: any) => {
    if (key === 'type') {
      setInputData({
        ...inputData,
        type: e.value,
      });
    } else {
      setInputData({
        ...inputData,
        [key]: e.target.value,
      });
    }
  };

  const onClickUpdate = async () => {
    let param: any = {
      Table: 'data_source',
      Fab: data.fileName,
      EqType: inputData.type,
      EqName: inputData.name,
      IO: 'UPDATE',
      Stage: inputData.stage,
      IP: inputData.ip,
      ID: data.datasourceId,
    };

    try {
      if (inputData.type.length === 0 && inputData.name.length === 0) {
        param.EqName = data.fileName + '_' + data.datasourceId;
      }
      await getBackendSrv().post('pythonCmd', param);
      if (mode === 'IN' && inputData.type.length > 0 && inputData.name.length > 0) {
        param.Table = 'dashboard';
        param.IO = mode;
        // param.ID = data.id;
        await getBackendSrv().post('pythonCmd', param);
      }
      setIsOpenEdit(false);
    } catch (err) {
      console.log(err);
      setIsAlert(true);
      setTimeout(() => {
        setIsAlert(false);
      }, 2000);
    } finally {
      data.onReflash();
    }
  };

  const onClickDelete = () => {
    setIsOpenAlert(false);
    setIsOpenEdit(false);
    deleteData();
  };

  useEffect(() => {
    setInputData({
      name: data.title ? data.title : '',
      type: data.eqtype ? data.eqtype : '',
      typeOption: data.eqTypeList ? data.eqTypeList : [],
      stage: data.stage,
      ip: data.ip ? data.ip : '',
    });
  }, [data]);

  return (
    <div className={cx(styles.rootbox)}>
      {isAlert && <Alert title="Update ERROR" severity="error" />}
      <div
        className={cx(
          styles.flex,
          css`
            justify-content: center;
          `
        )}
      >
        {data.fileName && (
          <Tag
            name={data.fileName}
            style={{
              fontSize: '15px',
              color: 'white',
              backgroundColor: data.color[0],
            }}
          />
        )}
        {data.stage && (
          <Tag
            name={data.stage.toUpperCase()}
            style={{
              fontSize: '15px',
              color: 'white',
              backgroundColor: data.color[1],
            }}
          />
        )}
      </div>
      <div className={cx(styles.flex)}>
        <p className={cx(styles.label)}>Product Type</p>
        {mode !== 'IN' ? (
          <Input value={inputData.type} width={25} disabled={true} />
        ) : (
          <Select
            // isSearchable={false}
            value={inputData.type}
            options={inputData.typeOption}
            onChange={onChangeData('type')}
            width={25}
            maxMenuHeight={280}
            // disabled={mode !== 'IN'}
          />
        )}
      </div>
      <div className={cx(styles.flex)}>
        <p className={cx(styles.label)}>Equipment S/N</p>
        <Input value={inputData.name} onChange={onChangeData('name')} width={25} disabled={mode !== 'IN'} />
      </div>
      <div className={cx(styles.flex)}>
        <p className={cx(styles.label)}>Stage</p>
        <Input value={inputData.stage} onChange={onChangeData('stage')} width={25} />
      </div>
      <div className={cx(styles.flex)}>
        <p className={cx(styles.label)}>Udap Server IP</p>
        <Input value={inputData.ip} onChange={onChangeData('ip')} width={25} />
      </div>
      <br />
      <div
        className={cx(
          styles.flex,
          css`
            justify-content: center;
          `
        )}
      >
        <Button size="md" variant="primary" onClick={onClickUpdate}>
          UPDATE
        </Button>
        &nbsp;&nbsp;
        {data.title && (
          <>
            <Button size="md" variant="destructive" onClick={() => setIsOpenAlert(true)}>
              DELETE
            </Button>
            &nbsp;&nbsp;
          </>
        )}
        <Button size="md" variant="secondary" onClick={() => setIsOpenEdit(false)}>
          CANCEL
        </Button>
      </div>
      <ConfirmModal
        isOpen={isOpenAlert}
        title="Delete Equipment Data"
        body={<span>Are you sure you want delete Equipment Data?</span>}
        confirmText="YES"
        icon="info-circle"
        onConfirm={onClickDelete}
        onDismiss={() => setIsOpenAlert(false)}
      />
    </div>
  );
};

const cardStyles = stylesFactory(() => {
  return {
    rootbox: css`
      height: fit-content;
      width: 100%;
      margin: 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 15px 0px 100px 0px;
    `,
    flex: css`
      height: fit-content;
      width: 400px;
      margin: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    `,
    label: css`
      margin: 0;
      padding: 0;
      font-size: 17px;
      font-weight: bold;
    `,
  };
});

export default memo(DashboardEdit);
