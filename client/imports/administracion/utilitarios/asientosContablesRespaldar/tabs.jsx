

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import SwipeableViews from 'react-swipeable-views';
import AppBar from '@material-ui/core/AppBar';
import { Grid, Paper, Tabs, Tab, Button } from "@material-ui/core";
import Typography from '@material-ui/core/Typography';

import Progress from '/client/imports/genericReactComponents/progress'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

function TabContainer({ children, dir }) {
  return (
    <Typography component="div" dir={dir} style={{ padding: 8 * 3 }}>
      {children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  dir: PropTypes.string.isRequired,
};

// ------------------------------------------------------------------------------------------------
// leemos la compañía seleccionada
let companiaSeleccionadaUser = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
let companiaSeleccionada = { numero: 0, };

if (companiaSeleccionadaUser) { 
    companiaSeleccionada = Companias.findOne(companiaSeleccionadaUser.companiaID, { fields: { numero: true } });
}
// ------------------------------------------------------------------------------------------------

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    width: '100%', 
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  button: {
    margin: theme.spacing.unit,
  },
});

class MyTabs extends React.Component {

    state = {
        showProgress: true, 
        error: false, 
        asientosInfoDesdeSql: [], 
        asientosInfoDesdeMonto: [], 
        value: 0,
    } 

    componentDidMount() {

        Promise.all([ leerCantidadAsientosSqlEnBasesDeDatos(companiaSeleccionada.numero), 
                      leerCantidadAsientosMongoEnBasesDeDatos(companiaSeleccionada.numero) ])
               .then(result => { 
                   // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
                   this.setState({ showProgress: false, 
                                   asientosInfoDesdeSql: result[0], 
                                   asientosInfoDesdeMonto: result[1], 
                                }); 
                })
               .catch((err) => { 
                    this.setState({ showProgress: false, 
                        asientosInfoDesdeSql: [], 
                        asientosInfoDesdeMonto: [], 
                        error: true, 
                    })
                })
    }

    handleChange = (event, value) => {
        this.setState({ value });
    };

    handleChangeIndex = index => {
        this.setState({ value: index });
    };

    render() {
        const { classes, theme } = this.props;

        return (
        <div className={classes.root}>

            { this.state.showProgress ? <Progress />  : '' }
            
            <AppBar position="static" color="default">
            <Tabs
                value={this.state.value}
                onChange={this.handleChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
            >
                <Tab label="Asientos contables" />
                <Tab label="Respaldo" />
            </Tabs>
            </AppBar>
            <SwipeableViews
            axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
            index={this.state.value}
            onChangeIndex={this.handleChangeIndex}
            >
                <TabContainer dir={theme.direction}>
                    <div className={classes.root}>
                        <Grid container spacing={8}>
                            <Grid item xs={12}>
                                <Paper className={classes.paper}>xs=12</Paper>
                            </Grid>

                            <Grid item xs={3}>
                                <Paper className={classes.paper}>xs=3</Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper className={classes.paper}>xs=3</Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Button variant="contained" color="primary" className={classes.button}>
                                    Respaldar
                                </Button>
                            </Grid>
                            <Grid item xs={3}>
                                <Button variant="contained" color="primary" className={classes.button}>
                                    Eliminar
                                </Button>
                            </Grid>
                        </Grid>
                    </div>
                </TabContainer>
                <TabContainer dir={theme.direction}>
                    <div className={classes.root}>
                        <Grid container spacing={8}>
                            <Grid item xs={12}>
                                <Paper className={classes.paper}>xs=12</Paper>
                            </Grid>

                            <Grid item xs={3}>
                                <Paper className={classes.paper}>xs=3</Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper className={classes.paper}>xs=3</Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper className={classes.paper}>xs=3</Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Button variant="contained" color="primary" className={classes.button}>
                                    Restablecer
                                </Button>
                            </Grid>
                        </Grid>
                    </div>
                </TabContainer>
            </SwipeableViews>
        </div>
        );
    }
}

MyTabs.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(MyTabs);



// para leer la cantidad de asientos registrados en sql; regresa un array; cada item es el año y la cantidad de asientos 
const leerCantidadAsientosSqlEnBasesDeDatos = (ciaContabSeleccionadaID) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('countAsientosSqlPorAnoFiscal', ciaContabSeleccionadaID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result.error) { 
                reject(result); 
            }
    
            resolve(result.items)
        })
    })
}


// para leer la cantidad de asientos respaldados en mongo; regresa un array; cada item es el año y la cantidad de asientos 
const leerCantidadAsientosMongoEnBasesDeDatos = (ciaContabSeleccionadaID) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('countAsientosMongoPorAnoFiscal', ciaContabSeleccionadaID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result.error) { 
                reject(result); 
            }
    
            resolve(result.items)
        })
    })
}