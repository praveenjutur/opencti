import React, { FunctionComponent } from 'react';
import SearchIndexedFilesLines, { searchIndexedFilesLinesQuery } from '@components/search/SearchIndexedFilesLines';
import {
  SearchIndexedFilesLinesPaginationQuery,
  SearchIndexedFilesLinesPaginationQuery$variables,
} from '@components/search/__generated__/SearchIndexedFilesLinesPaginationQuery.graphql';
import useQueryLoading from '../../../utils/hooks/useQueryLoading';
import Loader from '../../../components/Loader';
import useAuth from '../../../utils/hooks/useAuth';
import { usePaginationLocalStorage } from '../../../utils/hooks/useLocalStorage';
import { Filters } from '../../../components/list_lines';
import ListLines from '../../../components/list_lines/ListLines';
import ExportContextProvider from '../../../utils/ExportContextProvider';

// TODO : filters keys + redirectionMode + Datacolumns

const LOCAL_STORAGE_KEY = 'view-files';
const SearchIndexedFiles : FunctionComponent = () => {
  const {
    platformModuleHelpers: { isRuntimeFieldEnable },
  } = useAuth();

  const {
    viewStorage,
    helpers: storageHelpers,
    paginationOptions,
  } = usePaginationLocalStorage<SearchIndexedFilesLinesPaginationQuery$variables>(
    LOCAL_STORAGE_KEY,
    {
      sortBy: '_score',
      orderAsc: true,
      openExports: false,
      filters: {} as Filters,
    },
  );

  const {
    numberOfElements,
    filters,
    sortBy,
    orderAsc,
    openExports,
    // redirectionMode,
  } = viewStorage;

  const queryRef = useQueryLoading<SearchIndexedFilesLinesPaginationQuery>(
    searchIndexedFilesLinesQuery,
    {},
  );

  const renderLines = () => {
    const isRuntimeSort = isRuntimeFieldEnable() ?? false;
    const dataColumns = {
      id: {
        label: 'Filename',
        width: '10%',
        isSortable: true,
      },
      upload_date: {
        label: 'upload date',
        width: '22%',
        isSortable: false,
      },
      score: {
        label: 'Occurences',
        width: '12%',
        isSortable: isRuntimeSort,
      },
      entity_type: {
        label: 'Type of attached entity',
        width: '12%',
        isSortable: isRuntimeSort,
      },
      entity_name: {
        label: 'Name of attached entity',
        width: '12%',
        isSortable: isRuntimeSort,
      },
      objectMarking: {
        label: 'Marking of attached entity',
        width: '10%',
        isSortable: isRuntimeSort,
      },
    };

    return (
      <>
        <ListLines
          sortBy={sortBy}
          orderAsc={orderAsc}
          dataColumns={dataColumns}
          handleSort={storageHelpers.handleSort}
          handleAddFilter={storageHelpers.handleAddFilter}
          handleRemoveFilter={storageHelpers.handleRemoveFilter}
          handleChangeView={storageHelpers.handleChangeView}
          handleToggleExports={storageHelpers.handleToggleExports}
          openExports={openExports}
          exportEntityType="Stix-Core-Object"
          disableCards={true}
          filters={filters}
          paginationOptions={paginationOptions}
          numberOfElements={numberOfElements}
          iconExtension={true}
          availableFilterKeys={[
            'add filter keys',
          ]}
        >
          {queryRef && (
            <React.Suspense fallback={<Loader/>}>
              <SearchIndexedFilesLines
                queryRef={queryRef}
                paginationOptions={paginationOptions}
                dataColumns={dataColumns}
                onLabelClick={storageHelpers.handleAddFilter}
                setNumberOfElements={storageHelpers.handleSetNumberOfElements}
                />
            </React.Suspense>
          )}
        </ListLines>
      </>
    );
  };
  return (
    <ExportContextProvider>
      {renderLines()}
    </ExportContextProvider>
  );
};

export default SearchIndexedFiles;
