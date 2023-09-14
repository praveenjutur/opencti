import { last } from 'ramda';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import React, { FunctionComponent } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { truncate } from '../utils/String';
import { DataColumns } from './list_lines';
import { useFormatter } from './i18n';
import { Theme } from './Theme';
import { Filter, FilterGroup, filterValue } from '../utils/filters/filtersUtils';
import { TriggerLine_node$data } from '../private/components/profile/triggers/__generated__/TriggerLine_node.graphql';
import FilterIconButtonContent, { filterIconButtonContentQuery } from './FilterIconButtonContent';
import useQueryLoading from '../utils/hooks/useQueryLoading';
import Loader from './Loader';
import { FilterIconButtonContentQuery } from './__generated__/FilterIconButtonContentQuery.graphql';

const useStyles = makeStyles<Theme>((theme) => ({
  filters1: {
    float: 'left',
    margin: '5px 0 0 10px',
  },
  filters2: {
    marginTop: 20,
  },
  filters3: {
    height: 20,
    fontSize: 13,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
  filters4: {
    margin: '0 0 20px 0',
  },
  filters5: {
    float: 'left',
    margin: '2px 0 0 10px',
  },
  filters6: {
    float: 'left',
    margin: '2px 0 0 15px',
  },
  filter1: {
    marginRight: 10,
    lineHeight: 32,
    marginBottom: 10,
  },
  filter2: {
    margin: '0 10px 10px 0',
    lineHeight: 32,
  },
  filter3: {
    fontSize: 12,
    height: 20,
    marginRight: 7,
    borderRadius: 10,
    lineHeight: 32,
  },
  operator1: {
    fontFamily: 'Consolas, monaco, monospace',
    backgroundColor: theme.palette.background.accent,
    marginRight: 10,
    marginBottom: 10,
  },
  operator2: {
    fontFamily: 'Consolas, monaco, monospace',
    backgroundColor: theme.palette.background.accent,
    margin: '0 10px 10px 0',
  },
  operator3: {
    fontFamily: 'Consolas, monaco, monospace',
    backgroundColor: theme.palette.background.accent,
    height: 20,
    marginRight: 10,
  },
  inlineOperator: {
    display: 'inline-block',
    height: '100%',
    borderRadius: 0,
    margin: '0 5px 0 5px',
    padding: '0 5px 0 5px',
    backgroundColor: 'rgba(255, 255, 255, .1)',
    fontFamily: 'Consolas, monaco, monospace',
  },
  chipLabel: {
    lineHeight: '32px',
    maxWidth: 400,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

interface FilterIconButtonProps {
  availableFilterKeys?: string[];
  filters: FilterGroup;
  handleRemoveFilter?: (key: string, op?: string) => void;
  handleSwitchGlobalMode?: () => void;
  handleSwitchLocalMode?: (filter: Filter) => void;
  classNameNumber?: number;
  styleNumber?: number;
  dataColumns?: DataColumns;
  disabledPossible?: boolean;
  redirection?: boolean;
  resolvedInstanceFilters?: TriggerLine_node$data['resolved_instance_filters'];
}

const FilterIconButton: FunctionComponent<FilterIconButtonProps> = ({
  availableFilterKeys,
  filters,
  handleRemoveFilter,
  handleSwitchGlobalMode,
  handleSwitchLocalMode,
  classNameNumber,
  styleNumber,
  dataColumns,
  disabledPossible,
  redirection,
  resolvedInstanceFilters,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();

  let finalClassName = classes.filters1;
  if (classNameNumber === 2) {
    finalClassName = classes.filters2;
  } else if (classNameNumber === 3) {
    finalClassName = classes.filters3;
  } else if (classNameNumber === 4) {
    finalClassName = classes.filters4;
  } else if (classNameNumber === 5) {
    finalClassName = classes.filters5;
  } else if (classNameNumber === 6) {
    finalClassName = classes.filters6;
  }

  let classFilter = classes.filter1;
  let classOperator = classes.operator1;
  if (styleNumber === 2) {
    classFilter = classes.filter2;
    classOperator = classes.operator2;
  } else if (styleNumber === 3) {
    classFilter = classes.filter3;
    classOperator = classes.operator3;
  }
  const displayedFilters = filters?.filters
    .filter((currentFilter) => !availableFilterKeys
      || availableFilterKeys?.some((k) => currentFilter.key === k));
  const lastKey = last(displayedFilters)?.key;
  const lastOperator = last(displayedFilters)?.operator;

  const filtersRepresentativesQueryRef = useQueryLoading<FilterIconButtonContentQuery>(
    filterIconButtonContentQuery,
    { filters: filters.filters },
  );

  return (
    <div
      className={finalClassName}
      style={{ width: dataColumns?.filters.width }}
    >
      {displayedFilters
        .map((currentFilter) => {
          const filterKey = currentFilter.key;
          const filterValues = currentFilter.values;
          const negative = currentFilter.operator === 'not_eq';
          const operatorDisplay = currentFilter.operator !== 'eq' && currentFilter.operator !== 'not_eq';
          const keyLabel = operatorDisplay
            ? truncate(t(`filter_${filterKey}_${currentFilter.operator}`), 20)
            : truncate(t(`filter_${filterKey}`), 20);
          const label = `${negative ? `${t('NOT')} ` : ''}${keyLabel}`;
          const isNotLastFilter = lastKey !== filterKey || lastOperator !== currentFilter.operator;
          const values = (
          <>
            {filterValues.map((n) => {
              const value = filterValue(n);
              return (
                <span key={value}>
                  {filtersRepresentativesQueryRef && (
                    <React.Suspense fallback={<Loader />}>
                      <FilterIconButtonContent
                        redirection={redirection}
                        filterKey={filterKey}
                        id={n}
                        resolvedInstanceFilters={resolvedInstanceFilters}
                        filtersRepresentativesQueryRef={filtersRepresentativesQueryRef}
                      ></FilterIconButtonContent>
                    </React.Suspense>
                  )}
                  {last(filterValues) !== n && (
                    <Chip
                      className={classes.inlineOperator}
                      label={t(currentFilter.mode.toUpperCase())}
                      onClick={() => handleSwitchLocalMode?.(currentFilter)}
                    />
                  )}{' '}
              </span>
              );
            })}
          </>
          );
          return (
          <span key={filterKey}>
            <Tooltip
              title={
                <>
                  <strong>{label}</strong>: {values}
                </>
              }
            >
              <Chip
                classes={{ root: classFilter, label: classes.chipLabel }}
                label={
                  <>
                    <strong>{label}</strong>: {values}
                  </>
                }
                disabled={
                  disabledPossible
                    ? filters.filters.length === 1
                    : undefined
                }
                onDelete={
                  handleRemoveFilter
                    ? () => handleRemoveFilter(filterKey, currentFilter.operator)
                    : undefined
                }
              />
            </Tooltip>
            {isNotLastFilter && (
              <Chip
                classes={{ root: classOperator }}
                label={t(filters.mode.toUpperCase())}
                onClick={handleSwitchGlobalMode}
              />
            )}
          </span>
          );
        })}
    </div>
  );
};

export default FilterIconButton;
