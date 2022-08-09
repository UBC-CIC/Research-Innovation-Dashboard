import React from "react";
import { makeStyles } from "@mui/styles";
import { green, red } from "@mui/material/colors";
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";

const PasswordRequirements = ({ requirements }) => {
  const styles = makeStyles((theme) => ({
    valid: {
      color: green[500],
    },
    invalid: {
      color: red[500],
    },
    fontSize: {
      fontSize: "0.9rem",
    },
  }));

  const localStyles = styles();

  return (
    <List dense={true} className={localStyles.root}>
      {Object.entries(requirements).map((req) => {
        return (
          <ListItem key={req[0]}>
            <ListItemIcon>
              {req[1].error ? (
                <CheckCircle className={localStyles.valid} />
              ) : (
                <Cancel className={localStyles.invalid} />
              )}
            </ListItemIcon>
            <ListItemText
              className={localStyles.fontSize}
              primary={req[1].description}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default PasswordRequirements;
