import React, { ChangeEvent, ReactElement, useCallback } from 'react';
import { VerticalGroup } from '@grafana/ui';

import { TextBoxVariableModel } from '../types';
import { VariableEditorProps } from '../editor/types';
import { VariableSectionHeader } from '../editor/VariableSectionHeader';
import { VariableTextField } from '../editor/VariableTextField';
import { selectors } from '@grafana/e2e-selectors';

export interface Props extends VariableEditorProps<TextBoxVariableModel | any> {}

export function TextBoxVariableEditor({ onPropChange, variable: { query, placehold } }: Props): ReactElement {
  const updateVariable = useCallback(
    (event: ChangeEvent<HTMLInputElement>, updateOptions: boolean, name: any) => {
      event.preventDefault();
      if (name === 'value') {
        onPropChange({ propName: 'originalQuery', propValue: event.target.value, updateOptions: false });
        onPropChange({ propName: 'query', propValue: event.target.value, updateOptions });
      } else if (name === 'placehold') {
        // onPropChange({ propName: '_placehold', propValue: event.target.value, updateOptions: false });
        onPropChange({ propName: 'placehold', propValue: event.target.value, updateOptions });
      }
    },
    [onPropChange]
  );
  const onChange = useCallback(
    (name: any): any => (e: ChangeEvent<HTMLInputElement>) => updateVariable(e, false, name),
    [updateVariable]
  );
  const onBlur = useCallback((name: any): any => (e: ChangeEvent<HTMLInputElement>) => updateVariable(e, true, name), [
    updateVariable,
  ]);

  return (
    <VerticalGroup spacing="xs">
      <VariableSectionHeader name="Text Options" />
      <VariableTextField
        value={query}
        name="Default value"
        placeholder="default value, if any"
        onChange={onChange('value')}
        onBlur={onBlur('value')}
        labelWidth={20}
        grow
        ariaLabel={selectors.pages.Dashboard.Settings.Variables.Edit.TextBoxVariable.textBoxOptionsQueryInput}
      />
      <VariableTextField
        value={placehold}
        name="Default placehold"
        placeholder="default placehold, if any"
        onChange={onChange('placehold')}
        onBlur={onBlur('placehold')}
        labelWidth={20}
        grow
        ariaLabel={selectors.pages.Dashboard.Settings.Variables.Edit.TextBoxVariable.textBoxOptionsQueryInput}
      />
    </VerticalGroup>
  );
}
