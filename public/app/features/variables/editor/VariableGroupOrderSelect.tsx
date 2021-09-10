import React, { PropsWithChildren } from 'react';

import { VariableSelectField } from './VariableSelectField';

export function VariableGroupOrderSelect({ onChange, order }: PropsWithChildren<any>) {
  const OrderOptoins: any = [];

  for (let i = 0; i <= 10; i++) {
    OrderOptoins.push({
      label: i,
      value: i,
    });
  }

  return (
    <VariableSelectField
      name="Group Order"
      value={order}
      options={OrderOptoins}
      onChange={onChange}
      // ariaLabel={selectors.pages.Dashboard.Settings.Variables.Edit.General.generalHideSelect}
    />
  );
}
