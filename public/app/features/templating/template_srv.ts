import _ from 'lodash';
import { deprecationWarning, ScopedVars, TimeRange } from '@grafana/data';
import { getFilteredVariables, getVariables, getVariableWithName } from '../variables/state/selectors';
import { variableRegex } from '../variables/utils';
import { isAdHoc } from '../variables/guard';
import { VariableModel } from '../variables/types';
import { setTemplateSrv, TemplateSrv as BaseTemplateSrv } from '@grafana/runtime';
import { FormatOptions, formatRegistry } from './formatRegistry';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../variables/state/types';

interface FieldAccessorCache {
  [key: string]: (obj: any) => any;
}

export interface TemplateSrvDependencies {
  getFilteredVariables: typeof getFilteredVariables;
  getVariables: typeof getVariables;
  getVariableWithName: typeof getVariableWithName;
}

const runtimeDependencies: TemplateSrvDependencies = {
  getFilteredVariables,
  getVariables,
  getVariableWithName,
};

export class TemplateSrv implements BaseTemplateSrv {
  private _variables: any[];
  private regex = variableRegex;
  private index: any = {};
  private grafanaVariables: any = {};
  private timeRange?: TimeRange | null = null;
  private fieldAccessorCache: FieldAccessorCache = {};

  constructor(private dependencies: TemplateSrvDependencies = runtimeDependencies) {
    this._variables = [];
  }

  init(variables: any, timeRange?: TimeRange) {
    this._variables = variables;
    this.timeRange = timeRange;
    this.updateIndex();
  }

  /**
   * @deprecated: this instance variable should not be used and will be removed in future releases
   *
   * Use getVariables function instead
   */
  get variables(): any[] {
    deprecationWarning('template_srv.ts', 'variables', 'getVariables');
    return this.getVariables();
  }

  getVariables(): VariableModel[] {
    return this.dependencies.getVariables();
  }

  updateIndex() {
    const existsOrEmpty = (value: any) => value || value === '';

    this.index = this._variables.reduce((acc, currentValue) => {
      if (currentValue.current && (currentValue.current.isNone || existsOrEmpty(currentValue.current.value))) {
        acc[currentValue.name] = currentValue;
      }
      return acc;
    }, {});

    if (this.timeRange) {
      const from = this.timeRange.from.valueOf().toString();
      const to = this.timeRange.to.valueOf().toString();

      this.index = {
        ...this.index,
        ['__from']: {
          current: { value: from, text: from },
        },
        ['__to']: {
          current: { value: to, text: to },
        },
      };
    }
  }

  updateTimeRange(timeRange: TimeRange) {
    this.timeRange = timeRange;
    this.updateIndex();
  }

  variableInitialized(variable: any) {
    this.index[variable.name] = variable;
  }

  getAdhocFilters(datasourceName: string) {
    let filters: any = [];

    for (const variable of this.getAdHocVariables()) {
      if (variable.datasource === null || variable.datasource === datasourceName) {
        filters = filters.concat(variable.filters);
      } else if (variable.datasource.indexOf('$') === 0) {
        if (this.replace(variable.datasource) === datasourceName) {
          filters = filters.concat(variable.filters);
        }
      }
    }

    return filters;
  }

  formatValue(value: any, format: any, variable: any, text?: string) {
    // for some scopedVars there is no variable
    variable = variable || {};

    if (value === null || value === undefined) {
      return '';
    }

    // if it's an object transform value to string
    if (!Array.isArray(value) && typeof value === 'object') {
      value = `${value}`;
    }

    if (typeof format === 'function') {
      return format(value, variable, this.formatValue);
    }

    if (!format) {
      format = 'glob';
    }

    // some formats have arguments that come after ':' character
    let args = format.split(':');
    if (args.length > 1) {
      format = args[0];
      args = args.slice(1);
    } else {
      args = [];
    }

    let formatItem = formatRegistry.getIfExists(format);

    if (!formatItem) {
      console.error(`Variable format ${format} not found. Using glob format as fallback.`);
      formatItem = formatRegistry.get('glob');
    }

    const options: FormatOptions = { value, args, text: text ?? value };
    return formatItem.formatter(options, variable);
  }

  setGrafanaVariable(name: string, value: any) {
    this.grafanaVariables[name] = value;
  }

  /**
   * @deprecated: setGlobalVariable function should not be used and will be removed in future releases
   *
   * Use addVariable action to add variables to Redux instead
   */
  setGlobalVariable(name: string, variable: any) {
    deprecationWarning('template_srv.ts', 'setGlobalVariable', '');
    this.index = {
      ...this.index,
      [name]: {
        current: variable,
      },
    };
  }

  getVariableName(expression: string) {
    this.regex.lastIndex = 0;
    const match = this.regex.exec(expression);
    if (!match) {
      return null;
    }
    const variableName = match.slice(1).find((match) => match !== undefined);
    return variableName;
  }

  variableExists(expression: string): boolean {
    const name = this.getVariableName(expression);
    const variable = name && this.getVariableAtIndex(name);
    return variable !== null && variable !== undefined;
  }

  highlightVariablesAsHtml(str: string) {
    if (!str || !_.isString(str)) {
      return str;
    }

    str = _.escape(str);
    this.regex.lastIndex = 0;
    return str.replace(this.regex, (match, var1, var2, fmt2, var3) => {
      if (this.getVariableAtIndex(var1 || var2 || var3)) {
        return '<span class="template-variable">' + match + '</span>';
      }
      return match;
    });
  }

  getAllValue(variable: any) {
    if (variable.allValue) {
      return variable.allValue;
    }
    const values = [];
    for (let i = 1; i < variable.options.length; i++) {
      values.push(variable.options[i].value);
    }
    return values;
  }

  private getFieldAccessor(fieldPath: string) {
    const accessor = this.fieldAccessorCache[fieldPath];
    if (accessor) {
      return accessor;
    }

    return (this.fieldAccessorCache[fieldPath] = _.property(fieldPath));
  }

  private getVariableValue(variableName: string, fieldPath: string | undefined, scopedVars: ScopedVars) {
    const scopedVar = scopedVars[variableName];
    if (!scopedVar) {
      return null;
    }

    if (fieldPath) {
      return this.getFieldAccessor(fieldPath)(scopedVar.value);
    }

    return scopedVar.value;
  }

  private getVariableText(variableName: string, value: any, scopedVars: ScopedVars) {
    const scopedVar = scopedVars[variableName];

    if (!scopedVar) {
      return null;
    }

    if (scopedVar.value === value || typeof value !== 'string') {
      return scopedVar.text;
    }

    return value;
  }

  replace(target?: string, scopedVars?: ScopedVars, format?: string | Function): string {
    if (!target) {
      return target ?? '';
    }
    this.regex.lastIndex = 0;

    return target.replace(this.regex, (match, var1, var2, fmt2, var3, fieldPath, fmt3) => {
      const variableName = var1 || var2 || var3;
      const variable = this.getVariableAtIndex(variableName);
      const fmt = fmt2 || fmt3 || format;
      let _variables: any = {};
      for (let key in variable) {
        if (key === 'current') {
          _variables.current = {
            selected: variable.current.selected,
            text: variable.current.text,
            value: variable.current.value,
          };
        } else if (key === 'options') {
          _variables.options = variable.options.map((option: any) => ({
            text: option.text,
            value: option.value,
            selected: option.selected,
          }));
        } else {
          _variables[key] = variable[key];
        }
      }

      if (variable && variable.current) {
        let _rex: any = /(=~)/;
        let targetArr: any = target.split(' ');
        targetArr.forEach((word: any, index: any) => {
          if (word.indexOf('$' + variable.name) > -1) {
            if (_rex.test(word) || _rex.test(targetArr[index - 1])) {
              let simbolRex: any = ['\\', '$', '^', '*', '(', ')', '=', '+', '|', '[', ']', "'", ',', '.', '/', '?'];
              if (!variable.multi) {
                for (let j = 0; j < simbolRex.length; j++) {
                  _variables.current.text = _variables.current.text.replaceAll(simbolRex[j], '\\' + simbolRex[j]);
                  _variables.current.value = _variables.current.value.replaceAll(simbolRex[j], '\\' + simbolRex[j]);
                }
              }
              if (_variables && _variables.options) {
                _variables.options = _variables.options.map((option: any, idx: any) => {
                  if (option.text === 'All') {
                    return option;
                  }
                  let _text: any = option.text;
                  let _value: any = option.value;
                  for (let j = 0; j < simbolRex.length; j++) {
                    _text = _text.replaceAll(simbolRex[j], '\\' + simbolRex[j]);
                    _value = _value.replaceAll(simbolRex[j], '\\' + simbolRex[j]);
                  }
                  return {
                    text: _text,
                    value: _value,
                    selected: option.selected,
                  };
                });
              }
            } else if (!variable.multi) {
              let singleVariable: any = ['\\', "'"];
              for (let j = 0; j < singleVariable.length; j++) {
                _variables.current.text = _variables.current.text.replaceAll(
                  singleVariable[j],
                  '\\' + singleVariable[j]
                );
                _variables.current.value = _variables.current.value.replaceAll(
                  singleVariable[j],
                  '\\' + singleVariable[j]
                );
              }
            }
          }
        });
      }

      if (scopedVars) {
        const value = this.getVariableValue(variableName, fieldPath, scopedVars);
        const text = this.getVariableText(variableName, value, scopedVars);
        if (value !== null && value !== undefined) {
          return this.formatValue(value, fmt, _variables, text);
        }
      }

      if (!variable) {
        return match;
      }

      const systemValue = this.grafanaVariables[_variables.current.value];
      if (systemValue) {
        return this.formatValue(systemValue, fmt, _variables);
      }

      let value = _variables.current.value;
      let text = _variables.current.text;

      if (this.isAllValue(value)) {
        value = this.getAllValue(variable);
        text = ALL_VARIABLE_TEXT;
        // skip formatting of custom all values
        if (variable.allValue && fmt !== 'text' && fmt !== 'queryparam') {
          return this.replace(value);
        }
      }

      if (fieldPath) {
        const fieldValue = this.getVariableValue(variableName, fieldPath, {
          [variableName]: { value, text },
        });
        if (fieldValue !== null && fieldValue !== undefined) {
          return this.formatValue(fieldValue, fmt, _variables, text);
        }
      }

      // const res = this.formatValue(value, fmt, _variables, text);
      if (_variables.multi) {
        let strwrap_st = format ? '(' : '{';
        let strwrap_ed = format ? ')' : '}';
        let res: any = strwrap_st;
        let isAllvalue = false;
        if (format) {
          _variables.options.forEach((option: any) => {
            if (option.text === 'All' && option.selected) {
              isAllvalue = true;
            } else if (isAllvalue || option.selected) {
              res += option.text + '|';
            }
          });
        } else {
          variable.options.forEach((option: any) => {
            if (option.text === 'All' && option.selected) {
              isAllvalue = true;
            } else if (isAllvalue || option.selected) {
              res += option.text.replaceAll('"', '\\"') + ',';
            }
          });
        }
        return res.length > 1 ? res.slice(0, -1) + strwrap_ed : '';
      } else {
        if (format) {
          return _variables.current.text;
        } else {
          return variable.current.text.replaceAll('"', '\\"');
        }
      }
    });
  }

  isAllValue(value: any) {
    return value === ALL_VARIABLE_VALUE || (Array.isArray(value) && value[0] === ALL_VARIABLE_VALUE);
  }

  replaceWithText(target: string, scopedVars?: ScopedVars) {
    deprecationWarning('template_srv.ts', 'replaceWithText()', 'replace(), and specify the :text format');
    return this.replace(target, scopedVars, 'text');
  }

  private getVariableAtIndex(name: string) {
    if (!name) {
      return;
    }

    if (!this.index[name]) {
      return this.dependencies.getVariableWithName(name);
    }

    return this.index[name];
  }

  private getAdHocVariables(): any[] {
    return this.dependencies.getFilteredVariables(isAdHoc);
  }
}

// Expose the template srv
const srv = new TemplateSrv();
setTemplateSrv(srv);
export const getTemplateSrv = () => srv;
