import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { createFragmentContainer, graphql } from 'react-relay';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import makeStyles from '@mui/styles/makeStyles';
import { SearchIndexedFileLine_node$data } from '@components/search/__generated__/SearchIndexedFileLine_node.graphql';
import { DataColumns } from '../../../components/list_lines';
import { Theme } from '../../../components/Theme';
import { useFormatter } from '../../../components/i18n';
import ListItemIcon from "@mui/material/ListItemIcon";
import ItemIcon from "../../../components/ItemIcon";

// TODO clean css
const useStyles = makeStyles<Theme>((theme) => ({
  item: {
    paddingLeft: 10,
    height: 50,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  bodyItem: {
    height: 20,
    fontSize: 13,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 10,
  },
  goIcon: {
    position: 'absolute',
    right: -10,
  },
  itemIconDisabled: {
    color: theme.palette.grey?.[700],
  },
  placeholder: {
    display: 'inline-block',
    height: '1em',
    backgroundColor: theme.palette.grey?.[700],
  },
  chipInList: {
    fontSize: 12,
    height: 20,
    float: 'left',
    width: 120,
  },
}));

interface SearchIndexedFileLineComponentProps {
  node: SearchIndexedFileLine_node$data;
  dataColumns: DataColumns;
}

const SearchIndexedFileLineComponent: FunctionComponent<SearchIndexedFileLineComponentProps> = ({
  node,
  dataColumns,
}) => {
  const classes = useStyles();
  const { fd, t } = useFormatter();
  // TODO redirection (open the file and redirection to Entity) + translation
  return (
    <ListItem
      classes={{ root: classes.item }}
      divider={true}
      button={true}
      component={Link}
    >
      <ListItemText
        primary={
          <div>
            <div
              className={classes.bodyItem}
              style={{ width: dataColumns.name.width }}
            >
              {node.name}
            </div>
            <div
              className={classes.bodyItem}
              style={{ width: dataColumns.uploaded_at.width }}
            >
              {fd(node.uploaded_at)}
            </div>
            <div
                className={classes.bodyItem}
                style={{ width: dataColumns.entity_type.width }}
            >
              <ListItemIcon classes={{ root: classes.itemIcon }}>
                <ItemIcon type="Report" />
              </ListItemIcon>
            </div>
            <div
              className={classes.bodyItem}
              style={{ width: dataColumns.entity_name.width }}
            >
              <span>{'entity_name'}</span>
            </div>
            <div
              className={classes.bodyItem}
              style={{ width: dataColumns.objectMarking.width }}
            >
              <span>{'marking'}</span>
            </div>
          </div>
        }
      />
    </ListItem>
  );
};

const SearchIndexedFileLine = createFragmentContainer(SearchIndexedFileLineComponent, {
  node: graphql`
      fragment SearchIndexedFileLine_node on IndexedFile {
        id
        name
        uploaded_at
        file_id
      }
  `,
});

export default SearchIndexedFileLine;
