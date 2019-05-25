

import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar'
import { Grid, Paper } from "@material-ui/core";
import TypoGraphy from '@material-ui/core/Typography'

import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import 'typeface-roboto';

import MyTabs from './tabs'; 

// este 'main' react component representa la página html en react; sobre éste component se montarán todos lo demás, 
// necesarios para formar la funcionalidad de la página

function MyAppBar(props) {

  return (
    <div>
      <AppBar color="primary" position="static">
        <Toolbar>
          <TypoGraphy variant="title" color="inherit">
            contab / Asientos contables / Liberar
          </TypoGraphy>
        </Toolbar>
      </AppBar>
    </div>
  )
}

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
});

function CenteredGrid(props) {
  const { classes } = props;

  return (
    <div className={classes.root}>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <MyAppBar />
        </Grid>
        <Grid item xs={12}>
          <Paper square className={classes.paper}>
            <MyTabs />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

CenteredGrid.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(CenteredGrid);