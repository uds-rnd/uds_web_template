import { getBackendSrv } from '@grafana/runtime';
export const colorsArr: any = [
  ['#1976D2', '#FFB333', '#006974', '#EB6E47', '#880E4F', '#8561C5'],
  ['#0C3B6A', '#C49500', '#063020', '#872C0F', '#410725', '#442A74'],
];

export const query: any = {
  starred: false,
  skipRecent: true,
  skipStarred: true,
  folderIds: 0,
  layout: 'folders',
};

export const initFolderlist: any = (datasources: any, folder: any, file_arr: any, eqType: any, id: any) => {
  let fab_obj: any = {};
  datasources.forEach((dataSource: any) => {
    let _fab: any = dataSource.jsonData.httpHeaderName1 ? dataSource.jsonData.httpHeaderName1 : 'etc.';
    const _stage: any = dataSource.jsonData.httpHeaderName2 ? dataSource.jsonData.httpHeaderName2 : '';
    const folder_idx: number = folder.findIndex((f: any) => f.title === dataSource.name);

    let _tmp: any = {
      datasourceId: dataSource.id,
      fileName: _fab,
      stage: _stage,
      eqTypeList: eqType
        .split(',')
        .map((type: any) => ({ value: type.replaceAll(' ', ''), label: type.replaceAll(' ', '') })),
      ip: dataSource.url,
      loading: true,
      status: {
        alarmStatus: 'N/A',
        eqStatus: 'N/A',
        runningTime: 'N/A',
      },
    };

    if (folder_idx > -1) {
      const file_idx: number = file_arr.uid.indexOf(folder[folder_idx].uid);
      _tmp = {
        ..._tmp,
        ...folder[folder_idx],
        eqtype: file_arr.eqtype[file_idx],
      };
      // _fab = file_arr.fileorder[file_idx] + '$' + _fab;
    }
    if (!fab_obj[_fab]) {
      fab_obj[_fab] = [];
    }
    fab_obj[_fab].push(_tmp);
  });

  let coloridx = 0;
  for (let key in fab_obj) {
    fab_obj[key] = fab_obj[key]
      .sort((a: any, b: any) => a.datasourceId - b.datasourceId)
      .map((item: any) => ({
        ...item,
        color: [colorsArr[0][coloridx], colorsArr[1][coloridx]],
      }));
    coloridx++;
    coloridx = coloridx % 6;
  }

  if (id !== 'All') {
    fab_obj = {
      [id]: fab_obj[id] ? fab_obj[id] : [],
    };
  }

  return fab_obj;
};

export const statusapi: any = async (url: any, param: any, fabName: any) => {
  let StatusData: any = param.map((item: any) => ({ ...item }));
  const _dashboard: any = param.filter((item: any) => item.title).map((item: any) => item.title);
  try {
    let res: any = await getBackendSrv().post('/apiMiddleware', {
      url: url,
      param: {
        layer: fabName,
        equipment: _dashboard,
      },
    });
    for (let _key in res) {
      let _idx: any = StatusData.findIndex((f: any) => f.title === _key);
      StatusData[_idx].status = res[_key];
      StatusData[_idx].loading = false;
    }
    return StatusData;
  } catch (err) {
    throw err;
  }
  // const fetchHeader: any = {
  //   'Content-Type': 'application/json',
  //   'Access-Control-Allow-Origin': '*',
  //   'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
  // };
  // try {
  //   let res: any = await fetch(url, {
  //     method: 'POST',
  //     headers: fetchHeader,
  //     body: JSON.stringify({
  //       layer: fabName,
  //       equipment: _dashboard,
  //     }),
  //   });
  //   if (res.status === 200) {
  //     let _res: any = await res.json();
  //     ///////////////////////////////////////////
  //     for (let _key in _res) {
  //       let _idx: any = StatusData.findIndex((f: any) => f.title === _key);
  //       StatusData[_idx].status = _res[_key];
  //       StatusData[_idx].loading = false;
  //     }
  //     //////////////////////////////////////////
  //   }
  //   return StatusData;
  // } catch (err) {
  //   console.log(err);
  //   throw err;
  // }
};
