import React, { FunctionComponent } from 'react';
import { graphql } from 'react-relay';
import { Link } from 'react-router-dom';
import { entityFilters, filterValue } from '../utils/filters/filtersUtils';
import { truncate } from '../utils/String';
import { useFormatter } from './i18n';
import { FilterIconButtonContentQuery$data } from './__generated__/FilterIconButtonContentQuery.graphql';

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
  const { t } = useFormatter();

  const displayedValue = truncate(filterValue(filterKey, id, filtersRepresentatives), 15);

  if (displayedValue === null) {
    return (
      <>
        <del>{t('deleted')}</del>
      </>
    );
  }
  if (redirection && entityFilters.includes(filterKey)) {
    return (
      <Link to={`/dashboard/id/${id}`}>
        <span color="primary">{displayedValue}</span>
      </Link>
    );
  }
  return (
    <span>{displayedValue}</span>
  );
};

export default FilterIconButtonContent;
