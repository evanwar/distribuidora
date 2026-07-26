export type BusinessFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'date'
  | 'textarea'
  | 'boolean'
  | 'list'
  | 'select'
  | 'multi-select'
  | 'lines';

export interface BusinessLookup {
  readonly optionsEndpoint?: string;
  readonly optionValueKey?: string;
  readonly optionLabelKey?: string;
  readonly optionSecondaryKey?: string;
  readonly optionFilterKey?: string;
  readonly optionFilterValue?: string | number | boolean;
}

export interface BusinessField extends BusinessLookup {
  readonly key: string;
  readonly label: string;
  readonly source: 'path' | 'query' | 'body';
  readonly type: BusinessFieldType;
  readonly required?: boolean;
  readonly hint?: string;
  readonly defaultValue?: string | number | boolean;
  readonly itemFields?: readonly BusinessLineField[];
}

export interface BusinessLineField extends BusinessLookup {
  readonly key: string;
  readonly label: string;
  readonly type: 'text' | 'number' | 'select';
  readonly required?: boolean;
  readonly defaultValue?: string | number;
}

export interface BusinessModuleDefinition {
  readonly key: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly groups: Readonly<Record<string, string>>;
  readonly hiddenOperationIds?: readonly string[];
}

export interface BusinessResultRow {
  readonly id: string;
  readonly values: readonly { label: string; value: string }[];
}

export interface BusinessOption {
  readonly value: string | number;
  readonly label: string;
}
