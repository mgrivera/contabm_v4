

import React from 'react';
import PropTypes from 'prop-types';
import SwipeableViews from 'react-swipeable-views';
import { Grid, Paper, Tabs, Tab, Button, AppBar } from "@material-ui/core";
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

import Progress from '/client/imports/genericReactComponents/progress'; 
import CustomizedSnackbar from '/client/imports/genericReactComponents/customizedSnackbar'; 

import RowsFromSqlSimpleTable from './rowsFromSqlTable'; 
import RowsFromMongoSimpleTable from './rowsFromMongoTable'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

let companiaContabSeleccionada = { numero: 0, };

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

const styles = {
    tabLabel: {
        fontSize: '14px',
    },
}

class MyTabs extends React.Component {

    constructor(props) { 
        super(props); 

        this.state = {
            showProgress: true, 
            showMessage: false, 
            messageType: "",            // one of: success, warning , error, info        
            message: "", 
            error: false, 
            asientosInfoDesdeSql: [], 
            asientosInfoDesdeMongo: [], 
            asientosInfoDesdeSql_selectedIndex: null, 
            asientosInfoDesdeMongo_selectedIndex: null, 
            value: 0,
        } 

        this.handle_respaldarSqlEnMongo_click = this.handle_respaldarSqlEnMongo_click.bind(this);
        this.setAsientosSqlListIndex = this.setAsientosSqlListIndex.bind(this); 
        this.setAsientosMongoListIndex = this.setAsientosMongoListIndex.bind(this); 
        this.closeMessage = this.closeMessage.bind(this); 
        this.handle_eliminarAsientosSql_click = this.handle_eliminarAsientosSql_click.bind(this); 
        this.handle_restablecerAsientosDesdeMongoASql_click = this.handle_restablecerAsientosDesdeMongoASql_click.bind(this); 
    }

    componentDidMount() {

        // ------------------------------------------------------------------------------------------------
        // leemos la compañía seleccionada
        let companiaSeleccionadaUser = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        
        if (companiaSeleccionadaUser) { 
            companiaContabSeleccionada = Companias.findOne(companiaSeleccionadaUser.companiaID, { fields: { numero: true } });
        }
        // ------------------------------------------------------------------------------------------------

        Promise.all([ leerCantidadAsientosSqlEnBasesDeDatos(companiaContabSeleccionada.numero), 
                      leerCantidadAsientosMongoEnBasesDeDatos(companiaContabSeleccionada.numero) ])
               .then(result => { 
                   // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
                   this.setState({ showProgress: false, 
                                   asientosInfoDesdeSql: result[0], 
                                   asientosInfoDesdeMongo: result[1], 
                                }); 
                })
               .catch((err) => { 
                    this.setState({ showProgress: false, 
                        asientosInfoDesdeSql: [], 
                        asientosInfoDesdeMongo: [], 
                        error: true, 
                    })
                })
    }

    handleChange = (event, value) => {
        this.setState({ value });
    }

    handleChangeIndex = index => {
        this.setState({ value: index });
    }

    handle_respaldarSqlEnMongo_click() {
        const selectedIndex = this.state.asientosInfoDesdeSql_selectedIndex; 

        if (!selectedIndex && selectedIndex != 0) { 
            const message = "Ud. debe seleccionar un año fiscal de asientos contables en la lista, antes de hacer un click en el botón."; 
            this.setState({ 
                showMessage: true, 
                error: true, 
                message: message, 
                messageType: "error", 
            });

            return; 
        } 

        const anoFiscalSeleccionado = this.state.asientosInfoDesdeSql[selectedIndex].anoFiscal; 

        // para mostrar el progress y quitar algún mensaje que pueda estar mostrado 
        this.setState({ 
            showProgress: true, 
            showMessage: false, 
            error: false, 
            message: "", 
            messageType: "", 
        });

        // ejecutamos un método en el server que leerá los asientos para el año fiscal indicado y los 
        // copiará a mongo 
        respaldarAsientosSqlAMongo(anoFiscalSeleccionado, companiaContabSeleccionada.numero)
            .then(resultRespaldar => {

                // cuando la copia de los asientos termina, volvemos a leer la cantidad de asientos por año fiscal en 
                // ambas bases de datos, pues estos datos han cambiado ... 
                Promise.all([leerCantidadAsientosSqlEnBasesDeDatos(companiaContabSeleccionada.numero),
                             leerCantidadAsientosMongoEnBasesDeDatos(companiaContabSeleccionada.numero)])
                    .then(result => {
                        // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
                        this.setState({
                            showProgress: false,
                            asientosInfoDesdeSql: result[0],
                            asientosInfoDesdeMongo: result[1],

                            error: false, 
                            showMessage: true,  
                            message: resultRespaldar.message, 
                            messageType: "info", 
                        });
                    })
                    .catch((err) => {
                        this.setState({
                            showProgress: false,
                            error: true,
                            showMessage: true,  
                            message: err.message ? err.message : err, 
                            messageType: "error", 
                        })
                    })

            })
            .catch((err) => {
                this.setState({
                    showProgress: false,
                    error: true,
                    showMessage: true,  
                    message: err.message ? err.message : err, 
                    messageType: "error", 
                })
            }); 
    }



    handle_eliminarAsientosSql_click() {
        const selectedIndex = this.state.asientosInfoDesdeSql_selectedIndex; 

        if (!selectedIndex && selectedIndex != 0) { 
            const message = "Ud. debe seleccionar un año fiscal de asientos contables en la lista, antes de hacer un click en el botón."; 
            this.setState({ 
                showMessage: true, 
                error: true, 
                message: message, 
                messageType: "error", 
            });

            return; 
        } 

        const anoFiscalSeleccionado = this.state.asientosInfoDesdeSql[selectedIndex].anoFiscal; 

        // para mostrar el progress y quitar algún mensaje que pueda estar mostrado 
        this.setState({ 
            showProgress: true, 
            showMessage: false, 
            error: false, 
            message: "", 
            messageType: "", 
        });

        // ejecutamos un método en el server que leerá los asientos para el año fiscal indicado y los 
        // copiará a mongo 
        eliminarAsientosDesdeSql(anoFiscalSeleccionado, companiaContabSeleccionada.numero)
            .then(resultEliminarDesdeSql => {

                // cuando la copia de los asientos termina, volvemos a leer la cantidad de asientos por año fiscal en 
                // ambas bases de datos, pues estos datos han cambiado ... 
                Promise.all([leerCantidadAsientosSqlEnBasesDeDatos(companiaContabSeleccionada.numero),
                             leerCantidadAsientosMongoEnBasesDeDatos(companiaContabSeleccionada.numero)])
                    .then(result => {
                        // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
                        this.setState({
                            showProgress: false,
                            asientosInfoDesdeSql: result[0],
                            asientosInfoDesdeMongo: result[1],

                            error: false, 
                            showMessage: true,  
                            message: resultEliminarDesdeSql.message, 
                            messageType: "info", 
                        });
                    })
                    .catch((err) => {
                        this.setState({
                            showProgress: false,
                            error: true,
                            showMessage: true,  
                            message: err.message ? err.message : err, 
                            messageType: "error", 
                        })
                    })

            })
            .catch((err) => {
                this.setState({
                    showProgress: false,
                    error: true,
                    showMessage: true,  
                    message: err.message ? err.message : err, 
                    messageType: "error", 
                })
            }); 
    }

    handle_restablecerAsientosDesdeMongoASql_click() {
        const selectedIndex = this.state.asientosInfoDesdeMongo_selectedIndex; 

        if (!selectedIndex && selectedIndex != 0) { 
            const message = "Ud. debe seleccionar un año fiscal de asientos contables (seleccionar un respaldo) en la lista, antes de hacer un click en el botón."; 
            this.setState({ 
                showMessage: true, 
                error: true, 
                message: message, 
                messageType: "error", 
            });

            return; 
        } 

        const anoFiscalSeleccionado = this.state.asientosInfoDesdeMongo[selectedIndex]; 

        // para mostrar el progress y quitar algún mensaje que pueda estar mostrado 
        this.setState({ 
            showProgress: true, 
            showMessage: false, 
            error: false, 
            message: "", 
            messageType: "", 
        });

        // ejecutamos un método en el server que leerá los asientos para el año fiscal indicado y los 
        // copiará a mongo 
        restaurarAsientosDesdeMongoASql(anoFiscalSeleccionado.anoFiscal, companiaContabSeleccionada.numero, anoFiscalSeleccionado.headerId)
            .then(resultRestablecerDesdeMongo => {

                // cuando la copia de los asientos termina, volvemos a leer la cantidad de asientos por año fiscal en 
                // ambas bases de datos, pues estos datos han cambiado ... 
                Promise.all([leerCantidadAsientosSqlEnBasesDeDatos(companiaContabSeleccionada.numero),
                             leerCantidadAsientosMongoEnBasesDeDatos(companiaContabSeleccionada.numero)])
                    .then(result => {
                        // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
                        this.setState({
                            showProgress: false,
                            asientosInfoDesdeSql: result[0],
                            asientosInfoDesdeMongo: result[1],

                            error: false, 
                            showMessage: true,  
                            message: resultRestablecerDesdeMongo.message, 
                            messageType: "info", 
                        });
                    })
                    .catch((err) => {
                        this.setState({
                            showProgress: false,
                            error: true,
                            showMessage: true,  
                            message: err.message ? err.message : err, 
                            messageType: "error", 
                        })
                    })

            })
            .catch((err) => {
                this.setState({
                    showProgress: false,
                    error: true,
                    showMessage: true,  
                    message: err.message ? err.message : err,
                    messageType: "error", 
                })
            }); 
    }

    setAsientosSqlListIndex(idx) { 
        this.setState({
            asientosInfoDesdeSql_selectedIndex: idx
        })
    }

    setAsientosMongoListIndex(idx) { 
        this.setState({
            asientosInfoDesdeMongo_selectedIndex: idx
        })
    }

    closeMessage() { 
        this.setState({ 
            showMessage: false, 
            messageType: "",  
        }); 
    }

    render() {

        const { classes, theme } = this.props;

        return (
            <div style={{ margin: '1px', }}>

                { this.state.showProgress ? <Progress />  : '' }
                { this.state.showMessage ? <CustomizedSnackbar variant={this.state.messageType} message={this.state.message} close={this.closeMessage} /> : '' }
                
                <AppBar position="static" color="default">        {/* <Paper square> */}
                    <Tabs
                        value={this.state.value} onChange={this.handleChange}
                        indicatorColor="primary"
                        textColor="primary">
                        <Tab label={<span className={classes.tabLabel}>Asientos contables</span>} />
                        <Tab label={<span className={classes.tabLabel}>Respaldo</span>} />
                    </Tabs>
                </AppBar>

                <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'} 
                                index={this.state.value} 
                                onChangeIndex={this.handleChangeIndex}>
                    <TabContainer dir={theme.direction}>
                        <div>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Paper>
                                        <RowsFromSqlSimpleTable rows={this.state.asientosInfoDesdeSql} 
                                                                setAsientosSqlListIndex={this.setAsientosSqlListIndex} />
                                    </Paper>
                                </Grid>

                                <Grid item xs={4}>
                                </Grid>

                                <Grid item xs={4}>
                                </Grid>

                                <Grid item xs={2}>
                                    <Button variant="contained" color="primary" onClick={this.handle_respaldarSqlEnMongo_click}>
                                        Respaldar
                                    </Button>
                                </Grid>
                                <Grid item xs={2}>
                                    <Button variant="contained" color="primary" onClick={this.handle_eliminarAsientosSql_click}>
                                        Eliminar
                                    </Button>
                                </Grid>
                            </Grid>
                        </div>
                    </TabContainer>
                    <TabContainer dir={theme.direction}>
                        <div>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Paper>
                                        <RowsFromMongoSimpleTable rows={this.state.asientosInfoDesdeMongo}
                                                                  setAsientosMongoListIndex={this.setAsientosMongoListIndex} />
                                    </Paper>
                                </Grid>

                                <Grid item xs={3}>
                                </Grid>

                                <Grid item xs={3}>
                                </Grid>

                                <Grid item xs={3}>
                                </Grid>

                                <Grid item xs={3}>
                                    <Button variant="contained" color="primary" onClick={this.handle_restablecerAsientosDesdeMongoASql_click}>
                                        Restablecer
                                    </Button>
                                </Grid>
                            </Grid>
                        </div>
                    </TabContainer>
                </SwipeableViews>
            </div>
        )
    }
}

MyTabs.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true})(MyTabs);



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

// para leer un año fiscal de asientos desde sql y copiarlos a mongo 
const respaldarAsientosSqlAMongo = (anoFiscalSeleccionado, ciaContabSeleccionadaID) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('respaldarAsientosSqlAMongo', anoFiscalSeleccionado, ciaContabSeleccionadaID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result.error) { 
                reject(result); 
            }
    
            resolve(result)
        })
    })
}

// para eliminar un año fiscal de asientos en sql server 
const eliminarAsientosDesdeSql = (anoFiscalSeleccionado, ciaContabSeleccionadaID) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('eliminarAsientosSql', anoFiscalSeleccionado, ciaContabSeleccionadaID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result.error) { 
                reject(result); 
            }
    
            resolve(result)
        })
    })
}


// para eliminar un año fiscal de asientos en sql server 
const restaurarAsientosDesdeMongoASql = (anoFiscalSeleccionado, ciaContabSeleccionadaID, headerId) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('restaurarAsientosDesdeMongoASql', anoFiscalSeleccionado, ciaContabSeleccionadaID, headerId, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result.error) { 
                reject(result); 
            }
    
            resolve(result)
        })
    })
}