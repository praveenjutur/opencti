import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Close } from '@mui/icons-material';
import makeStyles from '@mui/styles/makeStyles';
import { useFormatter } from '../../../../components/i18n';
import { SubscriptionAvatars } from '../../../../components/Subscription';
import IndicatorEditionOverview from './IndicatorEditionOverview';
import { useIsEnforceReference } from '../../../../utils/hooks/useEntitySettings';

const useStyles = makeStyles((theme) => ({
  header: {
    backgroundColor: theme.palette.background.nav,
    padding: '20px 20px 20px 60px',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 5,
    color: 'inherit',
  },
  container: {
    padding: '10px 20px 20px 20px',
  },
  title: {
    float: 'left',
  },
}));

const IndicatorEditionContainer = (props) => {
  const classes = useStyles();
  const { t } = useFormatter();

  const { handleClose, indicator } = props;
  const { editContext } = indicator;

  return (
    <div>
      <div className={classes.header}>
        <IconButton
          aria-label="Close"
          className={classes.closeButton}
          onClick={handleClose}
          size="large"
          color="primary"
        >
          <Close fontSize="small" color="primary" />
        </IconButton>
        <Typography variant="h6" classes={{ root: classes.title }}>
          {t('Update an indicator')}
        </Typography>
        <SubscriptionAvatars context={editContext} />
        <div className="clearfix" />
      </div>
      <div className={classes.container}>
        <IndicatorEditionOverview
          indicator={indicator}
          enableReferences={useIsEnforceReference('Indicator')}
          context={editContext}
          handleClose={handleClose}
        />
      </div>
    </div>
  );
};

const IndicatorEditionFragment = createFragmentContainer(
  IndicatorEditionContainer,
  {
    indicator: graphql`
      fragment IndicatorEditionContainer_indicator on Indicator {
        id
        ...IndicatorEditionOverview_indicator
        editContext {
          name
          focusOn
        }
      }
    `,
  },
);

export default IndicatorEditionFragment;
