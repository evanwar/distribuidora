export type EntityFieldType = 'text' | 'email' | 'number' | 'boolean' | 'select';

export interface EntityOption {
  value: string | number;
  label: string;
}

export interface EntityFieldDefinition {
  key: string;
  label: string;
  type: EntityFieldType;
  required?: boolean;
  defaultValue?: string | number | boolean;
  table?: boolean;
  options?: readonly EntityOption[];
  optionsEndpoint?: string;
  optionLabelKey?: string;
  optionSecondaryKey?: string;
}

export interface EntityResourceDefinition {
  module: string;
  title: string;
  description: string;
  singular: string;
  createLabel?: string;
  listEndpoint: string;
  createEndpoint: string;
  updateEndpoint: string;
  detailEndpoint?: string;
  paged?: boolean;
  pageSize?: number;
  permissionPrefix?: string;
  fields: readonly EntityFieldDefinition[];
}

export type EntityRecord = Record<string, unknown> & { id?: string };
