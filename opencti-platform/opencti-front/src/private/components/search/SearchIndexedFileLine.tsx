import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { createFragmentContainer, graphql } from 'react-relay';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import makeStyles from '@mui/styles/makeStyles';
import { SearchIndexedFileLine_node$data } from '@components/search/__generated__/SearchIndexedFileLine_node.graphql';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import { DataColumns } from '../../../components/list_lines';
import { Theme } from '../../../components/Theme';
import { useFormatter } from '../../../components/i18n';
import ItemIcon from '../../../components/ItemIcon';
import { hexToRGB, itemColor } from '../../../utils/Colors';
import ItemMarkings from '../../../components/ItemMarkings';
import { getFileUri } from '../../../utils/utils';
import { resolveLink } from '../../../utils/Entity';

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
      component="a"
      href={getFileUri(node.file_id)}
    >
      <ListItemIcon classes={{ root: classes.itemIcon }}>
        <ItemIcon type="File" />
      </ListItemIcon>
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
              {node.entity && (
                <Chip
                  classes={{ root: classes.chipInList }}
                  style={{
                    backgroundColor: hexToRGB(itemColor(node.entity.entity_type), 0.08),
                    color: itemColor(node.entity.entity_type),
                    border: `1px solid ${itemColor(node.entity.entity_type)}`,
                  }}
                  label={t(`entity_${node.entity.entity_type}`)}
                />
              )}
            </div>
            <div
              className={classes.bodyItem}
              style={{ width: dataColumns.entity_name.width }}
            >
              {node.entity && (
                <Link to={`${resolveLink(node.entity.entity_type)}/${node.entity.id}/files`}>
                  <span>{node.entity?.representative.main}</span>
                </Link>
              )}
            </div>
            <div
              className={classes.bodyItem}
              style={{ width: dataColumns.objectMarking.width }}
            >
              {node.entity && (
                <ItemMarkings
                  variant="inList"
                  markingDefinitionsEdges={node.entity.objectMarking?.edges ?? []}
                  limit={1}
                />
              )}
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
        entity {
          ...on StixObject {
            id
            entity_type
            representative {
              main
            }
          }
          ...on StixCoreObject {
            objectMarking {
              edges {
                node {
                  id
                  definition_type
                  definition
                  x_opencti_order
                  x_opencti_color
                }
              }
            }
          }
        }
      }
  `,
});

export default SearchIndexedFileLine;
