import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from '@mui/material';
import FilterIconButtonContentWithRedirection from './FilterIconButtonContentWithRedirection';
import { truncate } from '../utils/String';
import { useFormatter } from './i18n';
import { TriggerLine_node$data } from '../private/components/profile/triggers/__generated__/TriggerLine_node.graphql';

interface FilterIconButtonContentWithRedirectionContainerProps {
  id: string,
  value: string,
  resolvedInstanceFilters?: TriggerLine_node$data['resolved_instance_filters'];
}

const FilterIconButtonContentWithRedirectionContainer: FunctionComponent<
FilterIconButtonContentWithRedirectionContainerProps
> = ({ id, value, resolvedInstanceFilters }) => {
  const { t } = useFormatter();
  const displayedValue = value && value.length > 0
    ? truncate(value, 15)
    : t('No label');
  const redirectionWithResolvedInstances = () => {
    const resolvedInstanceFiltersMap = new Map(
      resolvedInstanceFilters?.map((n) => [n.id, n]),
    );
    const invalidInstanceIds = resolvedInstanceFilters
      ?.filter((n) => !n.valid)
      .map((n) => n.id);
    return (
      <span>
        {invalidInstanceIds?.includes(id) ? (
          <Tooltip title={t('Deleted or restricted entity')}>
            <del>{displayedValue}</del>
          </Tooltip>
        ) : (
          <Link to={`/dashboard/id/${id}`}>
            <span color="primary">
              {resolvedInstanceFiltersMap.has(id)
                ? resolvedInstanceFiltersMap.get(id)?.value
                : t('No label')}
            </span>
          </Link>
        )}
      </span>
    );
  };
  const classicalRedirection = () => {
    return (
      <FilterIconButtonContentWithRedirection
        filterId={id}
        displayedValue={displayedValue}
      />
    );
  };
  if (resolvedInstanceFilters) {
    return redirectionWithResolvedInstances();
  }
  return classicalRedirection();
};

export default FilterIconButtonContentWithRedirectionContainer;
