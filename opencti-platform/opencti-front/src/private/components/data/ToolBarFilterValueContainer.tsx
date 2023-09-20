import React from 'react';
import { FilterGroup } from '../../../utils/filters/filtersUtils';
import { filterIconButtonContentQuery } from '../../../components/FilterIconButtonContent';
import useQueryLoading from '../../../utils/hooks/useQueryLoading';
import ToolBarFilterValue from './ToolBarFilterValue';
import Loader from '../../../components/Loader';
import { FilterIconButtonContentQuery } from '../../../components/__generated__/FilterIconButtonContentQuery.graphql';

const ToolBarFilterValueContainer = ({ filters }: {
  filters: FilterGroup,
}) => {
  const queryRef = useQueryLoading<FilterIconButtonContentQuery>(
    filterIconButtonContentQuery,
    { filters: filters.filters },
  );

  return (
    <>
      {queryRef && (
        <React.Suspense fallback={<Loader/>}>
          <ToolBarFilterValue filters={filters} queryRef={queryRef}
          ></ToolBarFilterValue>
        </React.Suspense>
      )}
    </>
  );
};

export default ToolBarFilterValueContainer;
