import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import React, { FunctionComponent } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useFormatter } from '../../../../components/i18n';
import { dateFilters, directFilters, FiltersVariant } from '../../../../utils/filters/filtersUtils';
import FilterDate from './FilterDate';
import FilterAutocomplete from './FilterAutocomplete';
import { Theme } from '../../../../components/Theme';

const useStyles = makeStyles<Theme>((theme) => ({
  helpertext: {
    display: 'inline-block',
    color: theme.palette.text?.secondary,
    marginTop: 20,
  },
}));

interface FiltersElementProps {
  variant?: string;
  keyword: string;
  availableFilterKeys: string[];
  searchContext: { entityTypes: string[], elementId?: string[] };
  handleChangeKeyword: (event: React.SyntheticEvent) => void;
  noDirectFilters?: boolean;
  setInputValues: (value: { key: string, values: (string | Date)[], operator?: string }[]) => void;
  inputValues: { key: string, values: (string | Date)[], operator?: string }[];
  defaultHandleAddFilter: (
    k: string,
    id: string,
    operator?: string,
    event?: React.SyntheticEvent
  ) => void;
  availableEntityTypes?: string[];
  availableRelationshipTypes?: string[];
  availableRelationFilterTypes?: Record<string, string[]>;
  allEntityTypes?: boolean;
}

const FiltersElement: FunctionComponent<FiltersElementProps> = ({
  variant,
  keyword,
  availableFilterKeys,
  searchContext,
  handleChangeKeyword,
  noDirectFilters,
  setInputValues,
  inputValues,
  defaultHandleAddFilter,
  availableEntityTypes,
  availableRelationshipTypes,
  availableRelationFilterTypes,
  allEntityTypes,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();
  const displayedFilters = availableFilterKeys
    .filter((n) => noDirectFilters || !directFilters.includes(n))
    .map((key) => {
      if (dateFilters.includes(key)) {
        return [{ key, operator: 'gt' }, { key, operator: 'lt' }];
      }
      return { key, operator: undefined };
    })
    .flat();
  return (
    <div>
      <Grid container={true} spacing={2}>
        {variant === FiltersVariant.dialog && (
          <Grid item={true} xs={12}>
            <TextField
              label={t('Global keyword')}
              variant="outlined"
              size="small"
              fullWidth={true}
              value={keyword}
              onChange={handleChangeKeyword}
            />
          </Grid>
        )}
        {displayedFilters
          .map((filter) => {
            const filterKey = filter.key;
            if (dateFilters.includes(filterKey)) {
              return (
                <Grid key={filterKey} item={true} xs={6}>
                  <FilterDate
                    defaultHandleAddFilter={defaultHandleAddFilter}
                    filterKey={filterKey}
                    operator={filter.operator}
                    inputValues={inputValues}
                    setInputValues={setInputValues}
                  />
                </Grid>
              );
            }
            return (
              <Grid key={filterKey} item={true} xs={6}>
                <FilterAutocomplete
                  filterKey={filterKey}
                  searchContext={searchContext}
                  defaultHandleAddFilter={defaultHandleAddFilter}
                  inputValues={inputValues}
                  setInputValues={setInputValues}
                  availableEntityTypes={availableEntityTypes}
                  availableRelationshipTypes={availableRelationshipTypes}
                  availableRelationFilterTypes={availableRelationFilterTypes}
                  allEntityTypes={allEntityTypes}
                  openOnFocus={true}
                />
              </Grid>
            );
          })}
      </Grid>
      <div className={classes.helpertext}>
        {t('Use')} <code>alt</code> + <code>click</code> {t('to exclude items')}
        .
      </div>
    </div>
  );
};

export default FiltersElement;
