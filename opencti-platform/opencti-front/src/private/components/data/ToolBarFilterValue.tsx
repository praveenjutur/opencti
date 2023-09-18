import * as R from 'ramda';
import React from 'react';
import { PreloadedQuery, usePreloadedQuery } from 'react-relay';
import Chip from '@mui/material/Chip';
import makeStyles from '@mui/styles/makeStyles';
import FilterIconButtonContent, { filterIconButtonContentQuery } from '../../../components/FilterIconButtonContent';
import { FilterIconButtonContentQuery } from '../../../components/__generated__/FilterIconButtonContentQuery.graphql';
import { useFormatter } from '../../../components/i18n';
import { Filter } from '../../../utils/filters/filtersUtils';
import { truncate } from '../../../utils/String';
import { Theme } from '../../../components/Theme';

const useStyles = makeStyles<Theme>((theme) => ({
  filter: {
    margin: '5px 10px 5px 0',
  },
  operator: {
    fontFamily: 'Consolas, monaco, monospace',
    backgroundColor: theme.palette.background.accent,
    margin: '5px 10px 5px 0',
  },
}));

const ToolBarFilterValue = ({ filtersList, queryRef }:
{
  filtersList: Filter[],
  queryRef: PreloadedQuery<FilterIconButtonContentQuery>,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();
  const { filtersRepresentatives } = usePreloadedQuery<FilterIconButtonContentQuery>(filterIconButtonContentQuery, queryRef);

  return (
    <>
      {filtersList.map((currentFilter) => {
        const label = `${truncate(
          currentFilter.key.startsWith('rel_')
            ? t(
              `relationship_${currentFilter.key
                .replace('rel_', '')
                .replace('.*', '')}`,
            )
            : t(`filter_${currentFilter.key}`),
          20,
        )}`;
        return (
          <span key={currentFilter.key}>
            <Chip
              classes={{ root: classes.filter }}
              label={
                <div>
                  <strong>{label}</strong>: {currentFilter.values.map(
                    (o) => {
                      const localFilterMode = t(currentFilter.operator.toUpperCase());
                      return (
                      <span key={o}>
                        <FilterIconButtonContent
                          filterKey={currentFilter.key}
                          id={o}
                          filtersRepresentatives={filtersRepresentatives}
                        ></FilterIconButtonContent>
                        {R.last(currentFilter.values) !== o
                          && (<code>{localFilterMode}</code>)
                        }{' '}
                      </span>
                      );
                    },
                  )}
                </div>
              }
            />
            {R.last(filtersList)?.key
              !== currentFilter.key && (
                <Chip
                  classes={{ root: classes.operator }}
                  label={t('AND')}
                />
            )}
          </span>
        );
      })}
    </>
  );
};

export default ToolBarFilterValue;
