import React from 'react';
import { Filter } from '../../../utils/filters/filtersUtils';
import { filterIconButtonContentQuery } from '../../../components/FilterIconButtonContent';
import useQueryLoading from '../../../utils/hooks/useQueryLoading';
import ToolBarFilterValue from './ToolBarFilterValue';
import Loader from '../../../components/Loader';
import { FilterIconButtonContentQuery } from '../../../components/__generated__/FilterIconButtonContentQuery.graphql';

const ToolBarFilterValueContainer = ({ filtersList }: {
  filtersList: Filter[],
}) => {
  const queryRef = useQueryLoading<FilterIconButtonContentQuery>(
    filterIconButtonContentQuery,
    { filters: filtersList },
  );

  return (
    <>
      {queryRef && (
        <React.Suspense fallback={<Loader/>}>
          <ToolBarFilterValue filtersList={filtersList} queryRef={queryRef}
          ></ToolBarFilterValue>
        </React.Suspense>
      )}
    </>
  );
};

export default ToolBarFilterValueContainer;
