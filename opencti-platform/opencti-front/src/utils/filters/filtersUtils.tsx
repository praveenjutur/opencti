import { truncate } from '../String';

export const FiltersVariant = {
  list: 'list',
  dialog: 'dialog',
};

export type BaseFilterObject = {
  mode: string;
  filters: (FilterGroup | Filter)[];
};

export type FilterGroup = {
  mode: string;
  type: 'group';
  filters: (FilterGroup | Filter)[]
};

export type Filter = {
  type: 'filter';
  key: string;
  values: string[];
  operator?: string;
  mode?: string;
};

export type BackendFilters = { // TODO to be removed
  key: string | string[];
  values: string[];
  operator?: string;
  filterMode?: string;
}[];

export const onlyGroupOrganization = ['x_opencti_workflow_id'];
export const directFilters = [
  'is_read',
  'channel_types',
  'pattern_type',
  'sightedBy',
  'container_type',
  'toSightingId',
  'x_opencti_negative',
  'fromId',
  'toId',
  'elementId',
  'note_types',
  'context',
  'trigger_type',
  'instance_trigger',
  'containers',
];
export const inlineFilters = [
  'is_read',
  'trigger_type',
  'instance_trigger',
];
// filters that can have 'eq' or 'not_eq' operator
export const EqFilters = [
  'labelledBy',
  'createdBy',
  'markedBy',
  'entity_type',
  'x_opencti_workflow_id',
  'malware_types',
  'incident_type',
  'context',
  'pattern_type',
  'indicator_types',
  'report_types',
  'note_types',
  'channel_types',
  'event_types',
  'sightedBy',
  'relationship_type',
  'creator',
  'x_opencti_negative',
  'source',
  'objectContains',
  'indicates',
  'targets',
];
// filters that represents a date, can have lt (end date) or gt (start date) operators
export const dateFilters = [
  'published',
  'created',
  'created_at',
  'modified',
  'valid_from',
  'start_time',
  'stop_time',
];
const uniqFilters = [
  'revoked',
  'x_opencti_detection',
  'x_opencti_base_score_gt',
  'x_opencti_base_score_lte',
  'x_opencti_base_score_lte',
  'confidence_gt',
  'confidence_lte',
  'likelihood_gt',
  'likelihood_lte',
  'x_opencti_negative',
  'x_opencti_score_gt',
  'x_opencti_score_lte',
  'toSightingId',
  'basedOn',
];
// filters that targets entities instances
export const entityFilters = [
  'elementId',
  'elementId_not_eq',
  'fromId',
  'toId',
  'createdBy',
  'createdBy_not_eq',
  'objectContains',
  'objectContains_not_eq',
  'indicates',
  'indicates_not_eq',
  'targets',
  'targets_not_eq',
];

export const isUniqFilter = (key: string) => uniqFilters.includes(key) || dateFilters.includes(key);

export const findFilterFromKey = (baseFilters: { filters: Filter[] }, key: string, operator?: string) => {
  const { filters } = baseFilters;
  for (const filter of filters) {
    if (filter.type === 'filter' && filter.key === key) {
      if (operator && filter.operator === operator) {
        return filter;
      }
      if (!operator) {
        return filter;
      }
    }
  }
  return null;
};

export const filtersWithEntityType = (filters: BaseFilterObject | undefined, type: string) => {
  const entityTypeFilter = {
    key: 'entity_type',
    values: [type],
    operator: 'eq',
    mode: 'or',
    type: 'filter' as const,
  };
  return (filters
    ? {
      mode: filters.mode,
      filters: [
        ...filters.filters,
        entityTypeFilter,
      ],
    }
    : undefined);
};

export const filterValue = (id: string) => {
  return truncate(id, 5); // TODO implement correctly
};
