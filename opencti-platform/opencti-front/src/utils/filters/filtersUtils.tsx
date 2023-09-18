import { truncate } from '../String';

export const FiltersVariant = {
  list: 'list',
  dialog: 'dialog',
};

export type FilterGroup = {
  mode: string;
  filters: Filter[];
  filterGroups: FilterGroup[];
};

export type Filter = {
  key: string;
  values: string[];
  operator: string;
  mode: string;
};

export type BackendFilters = { // TODO to be removed
  key: string | string[];
  values: string[];
  operator?: string;
  filterMode?: string;
}[];

export const initialFilterGroup = {
  mode: 'and',
  filters: [],
  filterGroups: [],
};

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
  'fromId',
  'toId',
  'createdBy',
  'objectContains',
  'indicates',
  'targets',
];

export const filtersWithRepresentative = [
  'toSightingId',
  'members_user',
  'members_group',
  'members_organization',
  'assigneeTo',
  'participant',
  'creator',
  'createdBy',
  'sightedBy',
  'elementId',
  'fromId',
  'toId',
  'targets',
  'objectContains',
  'indicates',
  'containers',
  'labelledBy',
  'markedBy',
  'killChainPhase',
  'x_opencti_workflow_id',
];

export const vocabularyFiltersWithTranslation = [
  'x_opencti_detection',
  'revoked',
  'is_read',
  'x_opencti_reliability',
  'source_reliability',
  'indicator_types',
  'incident_type',
  'report_types',
  'channel_types',
  'event_types',
  'context',
  'note_types'
];

export const isUniqFilter = (key: string) => uniqFilters.includes(key) || dateFilters.includes(key);

export const findFilterFromKey = (filters: Filter[], key: string, operator?: string) => {
  for (const filter of filters) {
    if (filter.key === key) {
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

export const findFilterIndexFromKey = (filters: Filter[], key: string, operator?: string) => {
  for (let i = 0; i < filters.length; i += 1) {
    const filter = filters[i];
    if (filter.key === key) {
      if (operator && filter.operator === operator) {
        return i;
      }
      if (!operator) {
        return i;
      }
    }
  }
  return null;
};

export const filtersWithEntityType = (filters: FilterGroup | undefined, type: string) => {
  const entityTypeFilter = {
    key: 'entity_type',
    values: [type],
    operator: 'eq',
    mode: 'or',
  };
  return (filters
    ? {
      mode: filters.mode,
      filterGroups: filters.filterGroups,
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

export const isFilterGroupNotEmpty = (filterGroup: FilterGroup) => {
  return filterGroup.filters.length > 0 || filterGroup.filterGroups.length > 0;
};
