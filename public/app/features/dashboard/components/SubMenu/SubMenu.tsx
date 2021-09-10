import React, { PureComponent } from 'react';
import { connect, MapStateToProps } from 'react-redux';
import { StoreState } from '../../../../types';
import { getSubMenuVariables } from '../../../variables/state/selectors';
import { VariableHide, VariableModel } from '../../../variables/types';
import { DashboardModel } from '../../state';
import { DashboardLinks } from './DashboardLinks';
import { Annotations } from './Annotations';
import { SubMenuItems } from './SubMenuItems';
import { DashboardLink } from '../../state/DashboardModel';
import { AnnotationQuery } from '@grafana/data';

interface OwnProps {
  dashboard: DashboardModel;
  links: DashboardLink[];
  annotations: AnnotationQuery[];
}

interface ConnectedProps {
  variables: VariableModel[];
}

interface DispatchProps {}

type Props = OwnProps & ConnectedProps & DispatchProps;

class SubMenuUnConnected extends PureComponent<Props> {
  onAnnotationStateChanged = (updatedAnnotation: any) => {
    // we're mutating dashboard state directly here until annotations are in Redux.
    for (let index = 0; index < this.props.dashboard.annotations.list.length; index++) {
      const annotation = this.props.dashboard.annotations.list[index];
      if (annotation.name === updatedAnnotation.name) {
        annotation.enable = !annotation.enable;
        break;
      }
    }
    this.props.dashboard.startRefresh();
    this.forceUpdate();
  };

  isSubMenuVisible = () => {
    if (this.props.dashboard.links.length > 0) {
      return true;
    }

    const visibleVariables = this.props.variables.filter((variable) => variable.hide !== VariableHide.hideVariable);
    if (visibleVariables.length > 0) {
      return true;
    }

    const visibleAnnotations = this.props.dashboard.annotations.list.filter((annotation) => annotation.hide !== true);
    return visibleAnnotations.length > 0;
  };

  sortVariableGroup = (variables: any, annotations: any) => {
    let _variableGroupArr: any = Array.from({ length: 20 }, () => [[], []]);
    for (let i = 0; i < variables.length; i++) {
      let groupOrder: any = variables[i].groupOrder ? variables[i].groupOrder : 0;
      _variableGroupArr[groupOrder][0].push(variables[i]);
    }

    for (let i = 1; i < annotations.length; i++) {
      let groupOrder: any = annotations[i].groupOrder ? annotations[i].groupOrder : 0;
      _variableGroupArr[groupOrder][1].push(annotations[i]);
    }
    return _variableGroupArr.filter((item: any) => item[0].length > 0 || item[1].length > 0);

    // for (let i = 0; i < variables.length; i++) {
    //   let groupName: any = variables[i].group !== '' ? variables[i].group : 'none';
    //   if (!_variableGroupObj.hasOwnProperty(groupName)) {
    //     _variableGroupObj[groupName] = [];
    //   }
    //   _variableGroupObj[groupName].push(variables[i]);
    // }
    // let _variableGroupArray: any = Object.entries(_variableGroupObj);
    // _variableGroupArray.sort((a: any, b: any) => {
    //   if (a[0] === 'none') {
    //     return 1;
    //   }
    //   if (b[0] === 'none') {
    //     return -1;
    //   }
    //   return a[1][0].groupOrder - b[1][0].groupOrder;
    // });
    // return _variableGroupArray;
  };

  render() {
    const { dashboard, variables, links, annotations } = this.props;
    const variableGroupArray: any = this.sortVariableGroup(variables, annotations);
    if (!this.isSubMenuVisible()) {
      return null;
    }

    return (
      <div>
        {variableGroupArray.map((group: any, idx: any) => {
          let groupName: any = null;
          if (group[0].length > 0) {
            for (let i = 0; i < group[0].length; i++) {
              if (group[0][i].group && group[0][i].group.length > 0) {
                groupName = group[0][i].group;
                break;
              }
            }
          }

          if (groupName === null && group[1].length > 0) {
            for (let i = 0; i < group[1].length; i++) {
              if (group[1][i].group && group[1][i].group.length > 0) {
                groupName = group[1][i].group;
                break;
              }
            }
          }

          return (
            <div key={'variabelGroup' + idx}>
              <div style={groupName && { marginTop: 10 }}>
                {groupName ? <p style={{ margin: 2, fontWeight: 'bold' }}>{groupName}</p> : null}
                <div className="submenu-controls">
                  <SubMenuItems variables={group[0]} />
                  <Annotations annotations={group[1]} onAnnotationChanged={this.onAnnotationStateChanged} />
                  <div className="gf-form gf-form--grow" />
                  {dashboard && <DashboardLinks dashboard={dashboard} links={links} />}
                  <div className="clearfix" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = (state) => {
  return {
    variables: getSubMenuVariables(state.templating.variables),
  };
};

export const SubMenu = connect(mapStateToProps)(SubMenuUnConnected);
SubMenu.displayName = 'SubMenu';
