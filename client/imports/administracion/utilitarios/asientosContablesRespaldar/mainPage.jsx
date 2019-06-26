

import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar'
import { Grid, Paper } from "@material-ui/core";
import TypoGraphy from '@material-ui/core/Typography'

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import 'typeface-roboto';

import MyTabs from './tabs'; 

const drawerWidth = 256;

const styles = {
  root: {
    display: 'flex',
    // minHeight: '100vh',
  },
  // drawer: {
  //   [theme.breakpoints.up('sm')]: {
  //     width: drawerWidth,
  //     flexShrink: 0,
  //   },
  // },
  appContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  mainContent: {
    flex: 1,
    padding: '48px 36px 0',
    background: '#eaeff1',
  },
};

// este 'main' react component representa la página html en react; sobre éste component se montarán todos lo demás, 
// necesarios para formar la funcionalidad de la página

function MyAppBar(props) {

  return (
    <div>
      <AppBar color="primary" position="static">
        <Toolbar>
          <TypoGraphy variant="h5" color="inherit">
            contab / Asientos contables / Liberar
          </TypoGraphy>
        </Toolbar>
      </AppBar>
    </div>
  )
}

class CenteredGrid extends React.Component {

  render() {
    const { classes, theme } = this.props;

    return (
      <div className={classes.root}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <MyAppBar />
          </Grid>
          <Grid item xs={12}>
            <Paper square>
              <MyTabs />
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  }
}

CenteredGrid.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true})(CenteredGrid);