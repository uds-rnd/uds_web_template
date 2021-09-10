import React, { FormEvent, PureComponent } from 'react';
import { MapDispatchToProps, MapStateToProps } from 'react-redux';
import { css } from 'emotion';
import { AppEvents, NavModel } from '@grafana/data';
import { Button, stylesFactory, Input, TextArea, Field, Form, Legend, FileUpload, Select } from '@grafana/ui';
import Page from 'app/core/components/Page/Page';
import { connectWithCleanUp } from 'app/core/components/connectWithCleanUp';
import { ImportDashboardOverview } from './components/ImportDashboardOverview';
import { validateDashboardJson, validateGcomDashboard } from './utils/validation';
import { fetchGcomDashboard, importDashboardJson } from './state/actions';
import appEvents from 'app/core/app_events';
import { getNavModel } from 'app/core/selectors/navModel';
import { StoreState } from 'app/types';
import { config } from '@grafana/runtime';

interface OwnProps {}

interface ConnectedProps {
  navModel: NavModel;
  isLoaded: boolean;
}

interface DispatchProps {
  fetchGcomDashboard: typeof fetchGcomDashboard;
  importDashboardJson: typeof importDashboardJson;
}

type Props = OwnProps & ConnectedProps & DispatchProps;

class DashboardImportUnConnected extends PureComponent<Props> {
  state: any = {
    choiceDatasource: null,
  };

  datasourceList: any = [];
  constructor(props: any) {
    super(props);
    for (let datasource in config.datasources) {
      if (config.datasources[datasource].isDefault) {
        this.state = {
          choiceDatasource: datasource,
        };
        // this.setState({
        //   choiceDatasource: datasource,
        // });
      }
      this.datasourceList.push({
        value: datasource,
        label: datasource,
      });
    }
  }

  onFileUpload = (event: FormEvent<HTMLInputElement>) => {
    const { importDashboardJson } = this.props;
    const file = event.currentTarget.files && event.currentTarget.files.length > 0 && event.currentTarget.files[0];

    if (file) {
      const reader = new FileReader();
      const readerOnLoad = () => {
        return (e: any) => {
          let dashboard: any;
          try {
            dashboard = JSON.parse(e.target.result);
          } catch (error) {
            appEvents.emit(AppEvents.alertError, [
              'Import failed',
              'JSON -> JS Serialization failed: ' + error.message,
            ]);
            return;
          }
          let rex: any = /trend|significant|json/i;
          dashboard.panels.forEach((panel: any) => {
            if (panel.type === 'row' && panel.panels) {
              panel.panels.forEach((subPanel: any) => {
                if (subPanel.datasource !== null) {
                  if (!rex.test(subPanel.datasource)) {
                    subPanel.datasource = this.state.choiceDatasource;
                  }
                } else {
                  subPanel.datasource = this.state.choiceDatasource;
                }
              });
            } else {
              if (panel.datasource !== null) {
                if (!rex.test(panel.datasource)) {
                  panel.datasource = this.state.choiceDatasource;
                }
              } else {
                panel.datasource = this.state.choiceDatasource;
              }
            }
          });

          if (dashboard.annotations.list) {
            dashboard.annotations.list.forEach((annotation: any) => {
              if (annotation.datasource !== '-- Grafana --') {
                if (annotation.datasource !== null) {
                  if (!rex.test(annotation.datasource)) {
                    annotation.datasource = this.state.choiceDatasource;
                  }
                } else {
                  annotation.datasource = this.state.choiceDatasource;
                }
              }
            });
          }

          if (dashboard.templating.list) {
            dashboard.templating.list.forEach((variable: any) => {
              if (variable.datasource !== null) {
                if (!rex.test(variable.datasource)) {
                  variable.datasource = this.state.choiceDatasource;
                }
              } else {
                variable.datasource = this.state.choiceDatasource;
              }
            });
          }
          importDashboardJson(dashboard);
        };
      };
      reader.onload = readerOnLoad();
      reader.readAsText(file);
    }
  };

  getDashboardFromJson = (formData: { dashboardJson: string }) => {
    this.props.importDashboardJson(JSON.parse(formData.dashboardJson));
  };

  getGcomDashboard = (formData: { gcomDashboard: string }) => {
    let dashboardId;
    const match = /(^\d+$)|dashboards\/(\d+)/.exec(formData.gcomDashboard);
    if (match && match[1]) {
      dashboardId = match[1];
    } else if (match && match[2]) {
      dashboardId = match[2];
    }

    if (dashboardId) {
      this.props.fetchGcomDashboard(dashboardId);
    }
  };

  changeDatasource = (event: any) => {
    this.setState({
      choiceDatasource: event.value,
    });
  };

  renderImportForm() {
    const styles = importStyles();

    return (
      <>
        <div className={styles.option}>
          <FileUpload accept="application/json" onFileUpload={this.onFileUpload}>
            Upload JSON file
          </FileUpload>
        </div>
        <div className={styles.option}>
          <Legend>Import via grafana.com</Legend>
          <Form onSubmit={this.getGcomDashboard} defaultValues={{ gcomDashboard: '' }}>
            {({ register, errors }) => (
              <Field invalid={!!errors.gcomDashboard} error={errors.gcomDashboard && errors.gcomDashboard.message}>
                <>
                  <Input
                    name="gcomDashboard"
                    placeholder="Grafana.com dashboard url or id"
                    type="text"
                    ref={register({
                      required: 'A Grafana dashboard url or id is required',
                      validate: validateGcomDashboard,
                    })}
                    addonAfter={<Button type="submit">Load</Button>}
                  />
                  <Select
                    isSearchable={false}
                    value={this.state.choiceDatasource}
                    options={this.datasourceList}
                    onChange={this.changeDatasource}
                  />
                </>
              </Field>
            )}
          </Form>
        </div>
        <div className={styles.option}>
          <Legend>Import via panel json</Legend>
          <Form onSubmit={this.getDashboardFromJson} defaultValues={{ dashboardJson: '' }}>
            {({ register, errors }) => (
              <>
                <Field invalid={!!errors.dashboardJson} error={errors.dashboardJson && errors.dashboardJson.message}>
                  <TextArea
                    name="dashboardJson"
                    ref={register({
                      required: 'Need a dashboard json model',
                      validate: validateDashboardJson,
                    })}
                    rows={10}
                  />
                </Field>
                <Button type="submit">Load</Button>
              </>
            )}
          </Form>
        </div>
      </>
    );
  }

  render() {
    const { isLoaded, navModel } = this.props;
    return (
      <Page navModel={navModel}>
        <Page.Contents>{isLoaded ? <ImportDashboardOverview /> : this.renderImportForm()}</Page.Contents>
      </Page>
    );
  }
}

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'import', undefined, true),
  isLoaded: state.importDashboard.isLoaded,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps, Props> = {
  fetchGcomDashboard,
  importDashboardJson,
};

export const DashboardImportPage = connectWithCleanUp(
  mapStateToProps,
  mapDispatchToProps,
  (state) => state.importDashboard
)(DashboardImportUnConnected);
export default DashboardImportPage;
DashboardImportPage.displayName = 'DashboardImport';

const importStyles = stylesFactory(() => {
  return {
    option: css`
      margin-bottom: 32px;
    `,
  };
});
