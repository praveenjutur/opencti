import React, { FunctionComponent, useState } from 'react';
import { graphql } from 'react-relay';
import { Link } from 'react-router-dom';
import {
  dateFilters,
  entityFilters, entityTypesFilters,
  filtersWithRepresentative,
  vocabularyFiltersWithTranslation,
} from '../utils/filters/filtersUtils';
import { truncate } from '../utils/String';
import { useFormatter } from './i18n';
import {
  FilterIconButtonContentQuery$data,
} from './__generated__/FilterIconButtonContentQuery.graphql';

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
  filtersRepresentatives: FilterIconButtonContentQuery$data['filtersRepresentatives'];
}

const FilterIconButtonContent: FunctionComponent<FilterIconButtonContentProps> = ({
  redirection,
  filterKey,
  id,
  filtersRepresentatives,
}) => {
  const { t, nsdt } = useFormatter();
  const [isDeleted, setDeleted] = useState(false);
  const filterValue = () => {
    if (filtersWithRepresentative.includes(filterKey)) {
      const value = filtersRepresentatives?.filter((n) => n?.id === id)?.[0]?.value;
      if (!value) {
        setDeleted(true);
        return 'deleted';
      }
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
    if (entityTypesFilters.includes(filterKey)) {
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
  const displayedValue = truncate(filterValue(), 15);
  const renderWithRedirection = () => {
    return (
      <>
        {!isDeleted
          ? (<Link to={`/dashboard/id/${id}`}>
            <span color="primary">{displayedValue}</span>
          </Link>)
          : (<del>{displayedValue}</del>)}
      </>
    );
  };
  if (redirection && entityFilters.includes(filterKey)) {
    return renderWithRedirection();
  }
  return (
    <span>
      {displayedValue}{' '}
    </span>
  );
};

export default FilterIconButtonContent;
