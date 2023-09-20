import React from 'react';
import { FilterGroup, filtersWithRepresentative } from '../utils/filters/filtersUtils';
import { filterIconButtonContentQuery } from './FilterIconButtonContent';
import useQueryLoading from '../utils/hooks/useQueryLoading';
import TaskFilterValue from './TaskFilterValue';
import Loader from './Loader';
import { FilterIconButtonContentQuery } from './__generated__/FilterIconButtonContentQuery.graphql';

const TasksFilterValueContainer = ({ filters }: {
  filters: FilterGroup,
}) => {
  const queryRef = useQueryLoading<FilterIconButtonContentQuery>(
    filterIconButtonContentQuery,
    { filters: filters.filters.filter((f) => filtersWithRepresentative.includes(f.key)) },
  );

  return (
    <>
      {queryRef && (
        <React.Suspense fallback={<Loader/>}>
          <TaskFilterValue filters={filters} queryRef={queryRef}
          ></TaskFilterValue>
        </React.Suspense>
      )}
    </>
  );
};

export default TasksFilterValueContainer;
