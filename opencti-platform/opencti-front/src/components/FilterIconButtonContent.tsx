import React, { FunctionComponent, useState } from 'react';
import { TriggerLine_node$data } from '@components/profile/triggers/__generated__/TriggerLine_node.graphql';
import { graphql, PreloadedQuery, usePreloadedQuery } from 'react-relay';
import {
  entityFilters,
  filtersWithRepresentative,
  vocabularyFiltersWithTranslation,
} from '../utils/filters/filtersUtils';
import { truncate } from '../utils/String';
import { useFormatter } from './i18n';
import { FilterIconButtonContentQuery } from './__generated__/FilterIconButtonContentQuery.graphql';
import { Link } from 'react-router-dom';

export const filterIconButtonContentQuery = graphql`
    query FilterIconButtonContentQuery(
        $filters: [Filter!]!
    ) {
        filtersRepresentatives(filters: $filters) {
            id
            value
        }
    }
`;
interface FilterIconButtonContentProps {
  redirection?: boolean;
  filterKey: string;
  id: string;
  resolvedInstanceFilters?: TriggerLine_node$data['resolved_instance_filters'];
  filtersRepresentativesQueryRef: PreloadedQuery<FilterIconButtonContentQuery>;
}

const FilterIconButtonContent: FunctionComponent<FilterIconButtonContentProps> = ({
  redirection,
  filterKey,
  id,
  resolvedInstanceFilters,
  filtersRepresentativesQueryRef,
}) => {
  const { t } = useFormatter();
  const [deleted, setDeleted] = useState(false);
  const { filtersRepresentatives } = usePreloadedQuery(filterIconButtonContentQuery, filtersRepresentativesQueryRef);
  const filterValue = () => {
    if (filtersWithRepresentative.includes(filterKey)) {
      setDeleted(true);
      return filtersRepresentatives?.filter((n) => n?.id === id)?.[0]?.value ?? t('deleted');
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
    if (['entity_type', 'entity_types', 'fromTypes', 'toTypes', 'relationship_types', 'container_type'].includes(filterKey)) {
      return id === 'all'
        ? t('entity_All')
        : t(
          id.toString()[0] === id.toString()[0].toUpperCase()
            ? `entity_${id.toString()}`
            : `relationship_${id.toString()}`,
        );
    }
    return id;
  };
  const displayedValue = truncate(filterValue(), 15);
  return (
    <>
      {redirection && entityFilters.includes(filterKey) ? (
        <>
          deleted
          ? (<Link to={`/dashboard/id/${id}`}>
            <span color="primary">{displayedValue}</span>
          </Link>
          )
          : (
          <del>{displayedValue}</del>)
        </>
      ) : (
        <span>
          {displayedValue}{' '}
        </span>
      )}
    </>
  );
};

export default FilterIconButtonContent;
