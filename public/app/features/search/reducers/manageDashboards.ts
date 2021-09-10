import { DashboardSection, DashboardSectionItem, SearchAction } from '../types';
import {
  TOGGLE_ALL_CHECKED,
  TOGGLE_CHECKED,
  MOVE_ITEMS,
  DELETE_ITEMS,
  TEST,
  ADD_FILE,
  DELETE_FILE,
  ASSIGN_FILE,
  RESET_FILE,
  MOVE_UP_FOLDER,
  MOVE_DOWN_FOLDER,
  MOVE_UP_DASHBOARD,
  MOVE_DOWN_DASHBOARD,
  ARRANGE_FOLDER,
  ARRANGE_DASHBOARD,
} from './actionTypes';
import { dashboardsSearchState, DashboardsSearchState, searchReducer } from './dashboardSearch';
import { mergeReducers } from '../utils';
import { getBackendSrv } from '@grafana/runtime';

export interface ManageDashboardsState extends DashboardsSearchState {
  fileArray: any;
  allChecked: boolean;
}

export const manageDashboardsState: ManageDashboardsState = {
  ...dashboardsSearchState,
  allChecked: false,
  fileArray: [],
};

const reducer = (state: ManageDashboardsState, action: SearchAction) => {
  switch (action.type) {
    case TOGGLE_ALL_CHECKED:
      const newAllChecked = !state.allChecked;
      return {
        ...state,
        results: state.results.map((result) => {
          return {
            ...result,
            checked: newAllChecked,
            items: result.items.map((item) => ({ ...item, checked: newAllChecked })),
          };
        }),
        allChecked: newAllChecked,
      };
    case TOGGLE_CHECKED:
      const { id } = action.payload;
      return {
        ...state,
        results: state.results.map((result) => {
          if (result.id === id) {
            return {
              ...result,
              checked: !result.checked,
              items: result.items.map((item) => ({ ...item, checked: !result.checked })),
            };
          }
          return {
            ...result,
            items: result.items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
          };
        }),
      };
    case MOVE_ITEMS: {
      const dashboards: DashboardSectionItem[] = action.payload.dashboards;
      const folder: DashboardSection = action.payload.folder;
      const uids = dashboards.map((db) => db.uid);
      return {
        ...state,
        results: state.results.map((result) => {
          if (folder.id === result.id) {
            return result.expanded
              ? {
                  ...result,
                  items: [...result.items, ...dashboards.map((db) => ({ ...db, checked: false }))],
                  checked: false,
                }
              : result;
          } else {
            return { ...result, items: result.items.filter((item) => !uids.includes(item.uid)) };
          }
        }),
      };
    }
    case DELETE_ITEMS: {
      const { folders, dashboards } = action.payload;
      if (!folders.length && !dashboards.length) {
        return state;
      }
      return {
        ...state,
        results: state.results.reduce((filtered, result) => {
          if (!folders.includes(result.uid)) {
            return [...filtered, { ...result, items: result.items.filter((item) => !dashboards.includes(item.uid)) }];
          }
          return filtered;
        }, []),
      };
    }
    case ADD_FILE: {
      const { fileName } = action.payload;
      const fileArray = [...state.fileArray];
      const newArray: any = fileArray.filter((file: any) => file !== '' && file !== undefined);
      newArray.push(fileName);
      return {
        ...state,
        fileArray: newArray,
      };
    }
    case DELETE_FILE: {
      const { fileName } = action.payload;
      const fileArray = [...state.fileArray];
      const newFileArray = fileArray.filter((element) => element !== fileName);
      return {
        ...state,
        fileArray: newFileArray,
      };
    }
    case ASSIGN_FILE: {
      const { files } = action.payload;
      const fileResults: any = [...state.results];
      files.forEach((element: any, index: number) => {
        fileResults[index]['files'] = element;
        // return element;
      });
      // const newResults = fileResults.map((element: any, index: number) => {
      //   element['files'] = files[index];
      //   return element;
      // });
      return {
        ...state,
        results: fileResults,
      };
    }
    case RESET_FILE: {
      const { files } = action.payload;
      return {
        ...state,
        fileArray: files,
      };
    }
    case MOVE_UP_FOLDER: {
      const { folder } = action.payload;
      const fileName = folder?.files;
      //
      const filterResult = [...state.results].filter((item: any, index: number) => {
        return item?.files === fileName;
      });
      const addOn = [...state.results].filter((item: any, index: number) => {
        return item?.files !== fileName;
      });
      const findIndex = filterResult.findIndex((item: any) => {
        return item?.title === folder?.title;
      });

      if (findIndex >= 1) {
        let tmp = filterResult[findIndex];
        filterResult[findIndex] = filterResult[findIndex - 1];
        filterResult[findIndex - 1] = tmp;
      }

      const answer = addOn.concat(filterResult);
      const uid = answer.filter((element) => element.title !== 'General').map((item) => item.uid);

      getBackendSrv()
        .post('filedashboardsave', {
          uid,
        })
        .then((data) => console.log(data));

      return {
        ...state,
        results: answer,
      };
    }
    case MOVE_DOWN_FOLDER: {
      const { folder } = action.payload;
      const fileName = folder?.files;
      //
      const filterResult = [...state.results].filter((item: any, index: number) => {
        return item?.files === fileName;
      });
      const addOn = [...state.results].filter((item: any, index: number) => {
        return item?.files !== fileName;
      });
      const findIndex = filterResult.findIndex((item: any) => {
        return item?.title === folder?.title;
      });

      if (filterResult?.length === 0) {
        return {
          ...state,
        };
      }

      if (findIndex < filterResult?.length - 1) {
        let tmp = filterResult[findIndex];
        filterResult[findIndex] = filterResult[findIndex + 1];
        filterResult[findIndex + 1] = tmp;
      }

      const answer = addOn.concat(filterResult);
      const uid = answer.filter((element) => element.title !== 'General').map((item) => item.uid);

      getBackendSrv()
        .post('filedashboardsave', {
          uid,
        })
        .then((data) => console.log(data));

      return {
        ...state,
        results: answer,
      };
    }
    case MOVE_UP_DASHBOARD: {
      const { dash } = action.payload;
      const index = state?.results.findIndex((item: any) => {
        return item?.items.includes(dash);
      });
      const newItems = [...state?.results[index]?.items];

      const findIndex = newItems.findIndex((item: any) => {
        return item === dash;
      });

      if (findIndex >= 1) {
        let tmp = newItems[findIndex];
        newItems[findIndex] = newItems[findIndex - 1];
        newItems[findIndex - 1] = tmp;

        const newResults = JSON.parse(JSON.stringify(state?.results));
        newResults[index].items = newItems;
        const uid = newItems.filter((element) => element.title !== 'General').map((item) => item.uid);

        getBackendSrv()
          .post('filedashboardsave', {
            uid,
          })
          .then((data) => console.log(data));
        return {
          ...state,
          results: newResults,
        };
      } else {
        return {
          ...state,
        };
      }
    }
    //
    case MOVE_DOWN_DASHBOARD: {
      const { dash } = action.payload;
      const index = state?.results.findIndex((item: any) => {
        return item?.items.includes(dash);
      });
      const newItems = [...state?.results[index]?.items];

      const findIndex = newItems.findIndex((item: any) => {
        return item === dash;
      });

      if (findIndex < newItems?.length - 1) {
        let tmp = newItems[findIndex];
        newItems[findIndex] = newItems[findIndex + 1];
        newItems[findIndex + 1] = tmp;
        const newResults = JSON.parse(JSON.stringify(state?.results));
        newResults[index].items = newItems;
        const uid = newItems.filter((element) => element?.title !== 'General').map((item) => item.uid);

        console.log('DASH DOWN: ', uid);

        getBackendSrv()
          .post('filedashboardsave', {
            uid,
          })
          .then((data) => console.log(data));

        return {
          ...state,
          results: newResults,
        };
      } else {
        return {
          ...state,
        };
      }
    }
    //
    case ARRANGE_FOLDER: {
      const { order, uidOrder, fileorder, files } = action.payload;

      let fileArr: any = [];
      let fileObj: any = {};
      for (let i = 0; i < fileorder.length; i++) {
        let nOrder: any = parseInt(order[i], 10);
        let nFileOrder: any = parseInt(fileorder[i], 10);
        order[i] = isNaN(nOrder) ? 0 : nOrder;
        fileorder[i] = isNaN(nFileOrder) ? 0 : nFileOrder;
        fileArr.push([files[i], uidOrder[i], order[i]]);
        fileObj[files[i]] = fileorder[i];
      }

      fileArr.sort((a: any, b: any) => a[2] - b[2]);

      let fileArray: any = Object.entries(fileObj)
        .sort((a: any, b: any): any => a[1] - b[1])
        .map((file: any) => file[0]);

      let resultArr: any = [];
      const newState = [...state.results.filter((item) => item?.title !== 'General')];
      const newGeneral: any = [...state.results.filter((item) => item?.title === 'General')];
      for (let i = 0; i < fileArr.length; i++) {
        for (let j = 0; j < newState.length; j++) {
          if (fileArr[i][1] === newState[j].uid) {
            newState[j].files = fileArr[i][0];
            resultArr.push(newState[j]);
            break;
          }
        }
      }
      resultArr = resultArr.concat(newGeneral);
      return {
        ...state,
        results: resultArr,
        fileArray: fileArray,
      };

      // const orderUidMerge: any = [];
      // console.log(action.payload);
      // for (let i in order) {
      //   let eleArray = [];
      //   eleArray.push(uidOrder[i], order[i], files[i]);
      //   orderUidMerge.push(eleArray);
      // }
      // console.log(orderUidMerge);
      // const answer = orderUidMerge.sort((a: any, b: any) => a[1] - b[1]).map((item: any) => item[0]);
      // const newState = [...state.results.filter((item) => item?.title !== 'General')];
      // const newGeneral: any[] = [...state.results.filter((item) => item?.title === 'General')];

      // console.log(answer);
      // console.log(newState);
      // console.log(newGeneral);
      // const orderFileAnswer: any[] = [];
      // for (let i = 0; i < Array.from(new Set(files)).length; i++) {
      //   const answerIndex = fileorder.findIndex((item: any) => Number(item) === i);
      //   orderFileAnswer.push(files[Number(answerIndex)]);
      // }
      // console.log(orderFileAnswer);

      // let realAnswer = [];
      // for (let i = 0; i < uidOrder.length; i++) {
      //   for (let j = 0; j < uidOrder.length; j++) {
      //     if (answer[i] === newState[j]?.uid) {
      //       realAnswer.push(newState[j]);
      //     }
      //   }
      // }
      // console.log(realAnswer);
      // const userFolder: any[] = realAnswer
      //   .map((item: any, index: number) => {
      //     item['files'] = orderUidMerge[index][2];
      //     return item;
      //   })
      //   .concat(newGeneral);

      // const complement = [...state.results].filter((value) => !userFolder.includes(value));
      // console.log(userFolder);
      // console.log(complement);
      // return {
      //   ...state,
      //   results: userFolder.concat(complement),
      //   fileArray: orderFileAnswer,
      // };
    }
    case ARRANGE_DASHBOARD: {
      const { order, uidOrder } = action.payload;
      const orderUidMerge: any = [];

      for (let i in order) {
        let eleArray = [];
        eleArray.push(uidOrder[i], order[i]);
        orderUidMerge.push(eleArray);
      }

      const answer = orderUidMerge.sort((a: any, b: any) => a[1] - b[1]).map((item: any) => item[0]);
      const findIndex: any = [...state.results].findIndex((item: any) => {
        return (
          item?.items.findIndex((element: any) => {
            return element?.uid === uidOrder[0];
          }) >= 0
        );
      });

      const target: any = [...state.results][findIndex];
      let realAnswer: any = [];
      for (let i = 0; i < uidOrder.length; i++) {
        for (let j = 0; j < uidOrder.length; j++) {
          if (answer[i] === target?.items[j]?.uid) {
            realAnswer.push(target?.items[j]);
          }
        }
      }
      const superAnswer: any = [...state.results];
      superAnswer[findIndex]['items'] = realAnswer;

      return {
        ...state,
        result: superAnswer.map((item: any) => {
          item['waferMark'] = true;
          return item;
        }),
      };
    }
    case TEST: {
      return state;
    }
    default:
      return state;
  }
};

export const manageDashboardsReducer = mergeReducers([searchReducer, reducer]);
