import React, { FunctionComponent } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import { SearchIndexedFilesLinesQuery } from '@components/search/__generated__/SearchIndexedFilesLinesQuery.graphql';
import useQueryLoading from '../../../utils/hooks/useQueryLoading';
import Loader, { LoaderVariant } from '../../../components/Loader';

const searchIndexedFilesLinesQuery = graphql`
    query SearchIndexedFilesLinesQuery {
        indexedFiles{
            edges {
                node {
                    id
                }
            }
        }
    }
`;

const SearchIndexedFilesLinesComponent : FunctionComponent = ({ queryRef }) => {
  const data = usePreloadedQuery<SearchIndexedFilesLinesQuery>(
    searchIndexedFilesLinesQuery,
    queryRef,
  );
  const indexedFiles = data.indexedFiles?.edges;

  return (
    <div>
      { (indexedFiles && indexedFiles.length > 0)
        ? indexedFiles.map((indexedFile) => (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span>{indexedFile.node.id}</span>
          </div>
        )) : (
          'No files found'
        )
      }
    </div>
  );
};
const SearchIndexedFilesLines: FunctionComponent = () => {
  const queryRef = useQueryLoading<SearchIndexedFilesLinesQuery>(
    searchIndexedFilesLinesQuery,
    {},
  );
  return queryRef ? (
    <React.Suspense fallback={<Loader variant={LoaderVariant.inElement} />}>
      <SearchIndexedFilesLinesComponent
        queryRef={queryRef}
      />
    </React.Suspense>
  ) : (
    <Loader variant={LoaderVariant.inElement} />
  );
};

export default SearchIndexedFilesLines;
