import React, { useState, FunctionComponent } from 'react';
import { Field } from 'formik';
import { graphql } from 'react-relay';
import makeStyles from '@mui/styles/makeStyles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import useAuth from '../../../../utils/hooks/useAuth';
import ItemIcon from '../../../../components/ItemIcon';
import Transition from '../../../../components/Transition';
import AutocompleteField from '../../../../components/AutocompleteField';
import { RenderOption } from '../../../../components/list_lines';
import { useFormatter } from '../../../../components/i18n';
import { convertMarking } from '../../../../utils/edition';
import { Option } from './ReferenceField';

const useStyles = makeStyles(() => ({
  icon: {
    paddingTop: 4,
    display: 'inline-block',
  },
  text: {
    display: 'inline-block',
    flexGrow: 1,
    marginLeft: 10,
  },
}));

export const objectMarkingFieldAllowedMarkingsQuery = graphql`
    query ObjectMarkingFieldAllowedMarkingsQuery {
        me {
            allowed_marking {
                id
                entity_type
                standard_id
                definition_type
                definition
                x_opencti_color
                x_opencti_order
            }
        }
    }
`;

interface ObjectMarkingFieldProps {
  name: string;
  style?: React.CSSProperties;
  onChange: (name: string, values: Option[]) => void;
  helpertext?: unknown;
  disabled?: boolean;
  label?: string;
  setFieldValue?: (name: string, values: Option[]) => void
}

const ObjectMarkingField: FunctionComponent<ObjectMarkingFieldProps> = ({
  name,
  style,
  onChange,
  helpertext,
  disabled,
  label,
  setFieldValue,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const [newMarking, setNewMarking] = useState<Option[] | undefined>(undefined);

  const { me } = useAuth();
  const allowedMarkingDefinitions = me.allowed_marking?.map(convertMarking) ?? [];

  const optionSorted = allowedMarkingDefinitions.sort((a, b) => {
    if (a.entity.definition_type === b.entity.definition_type) {
      return (a.entity.x_opencti_order < b.entity.x_opencti_order ? -1 : 1);
    } return (a.entity.definition_type < b.entity.definition_type ? -1 : 1);
  });
  const handleClose = () => {
    setNewMarking(undefined);
  };
  const handleCancellation = () => {
    newMarking?.pop();
    setFieldValue?.(name, newMarking as Option[]);
    setNewMarking(undefined);
  };
  const submitUpdate = () => {
    onChange(name, newMarking as Option[]);
    handleClose();
  };
  const handleOnChange = (n: string, values: Option[]) => {
    const valueAdded = values.filter((m) => values.find((item) => item.definition_type === m.definition_type && item.x_opencti_order !== m.x_opencti_order));

    if (valueAdded.length) {
      setNewMarking([...values]);
    } else onChange(name, values);
  };

  const renderOption: RenderOption = (props, option) => (
      <li {...props}>
          <div className={classes.icon} style={{ color: option.color }}>
              <ItemIcon type="Marking-Definition" color={option.color}/>
          </div>
          <div className={classes.text}>{option.label}</div>
      </li>
  );

  return (
      <>
        <Field
            component={AutocompleteField}
            style={style}
            name={name}
            multiple={true}
            disabled={disabled}
            textfieldprops={{
              variant: 'standard',
              label: label ?? t('Markings'),
              helperText: helpertext,
            }}
            noOptionsText={t('No available options')}
            options={optionSorted}
            onChange={typeof onChange === 'function' ? handleOnChange : null}
            renderOption={renderOption}
        />
         <Dialog
            PaperProps={{ elevation: 1 }}
            open={!!newMarking}
            keepMounted={true}
            TransitionComponent={Transition}
            onClose={handleClose}
         >
          <DialogContent>
            <DialogContentText>
              {t('You are about to change the marking with another rank.')}
            </DialogContentText>
              <DialogContentText>
              {t('Are you sure you want to make the change?')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
             <Button onClick={handleCancellation}>
              {t('Cancel')}
             </Button>
             <Button color="secondary" onClick={submitUpdate}>
              {t('Replace')}
             </Button>
          </DialogActions>
         </Dialog>
      </>
  );
};

export default ObjectMarkingField;
