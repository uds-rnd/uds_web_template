import React, { FC } from 'react';
import { HorizontalGroup, LinkButton } from '@grafana/ui';

export interface Props {
  folderId?: number;
  isEditor: boolean;
  canEdit?: boolean;
  fileState?: boolean;
  fileModal?: any;
}

export const DashboardActions: FC<Props> = ({ folderId, isEditor, canEdit, fileState, fileModal }) => {
  const actionUrl = (type: string) => {
    let url = `dashboard/${type}`;

    if (folderId) {
      url += `?folderId=${folderId}`;
    }

    return url;
  };

  return (
    <HorizontalGroup spacing="md" align="center">
      {!folderId && isEditor && <LinkButton onClick={() => fileModal(!fileState)}>Assign File</LinkButton>}
      {!folderId && isEditor && <LinkButton href="dashboards/folder/new">New Folder</LinkButton>}
      {canEdit && <LinkButton href={actionUrl('new')}>New Dashboard</LinkButton>}
      {canEdit && <LinkButton href={actionUrl('import')}>Import</LinkButton>}
    </HorizontalGroup>
  );
};
