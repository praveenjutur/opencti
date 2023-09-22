import { useFormatter } from '../../components/i18n';

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
  'objectLabel',
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
  'objects',
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
  'objects',
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
  'objects',
  'indicates',
  'containers',
  'objectLabel',
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
  'note_types',
];

export const entityTypesFilters = ['entity_type', 'entity_types', 'fromTypes', 'toTypes', 'relationship_types', 'container_type'];

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

export const filtersWithEntityType = (filters: FilterGroup | undefined, type: string | string[]) => {
  const entityTypeFilter = {
    key: 'entity_type',
    values: Array.isArray(type) ? type : [type],
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

export const isFilterGroupNotEmpty = (filterGroup: FilterGroup) => {
  return filterGroup.filters.length > 0 || filterGroup.filterGroups.length > 0;
};

export const filterValue = (filterKey: string, id: string | null, value?: string | null) => {
  const { t, nsdt } = useFormatter();
  if (value || value === null) { // resolved value or deleted entity
    return value;
  }
  if (vocabularyFiltersWithTranslation.includes(filterKey)) {
    return t(id);
  }
  if (filterKey === 'basedOn') {
    return id === 'EXISTS' ? t('Yes') : t('No');
  }
  if (filterKey === 'x_opencti_negative') {
    return t(id ? 'False positive' : 'Malicious');
  }
  if (id && entityTypesFilters.includes(filterKey)) {
    return id === 'all'
      ? t('entity_All')
      : t(
        id.toString()[0] === id.toString()[0].toUpperCase()
          ? `entity_${id.toString()}`
          : `relationship_${id.toString()}`,
      );
  }
  if (dateFilters.includes(filterKey)) {
    return nsdt(id);
  }
  return id;
};
