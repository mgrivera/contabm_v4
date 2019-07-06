

import React from 'react';
import { Grid, Paper, Button, } from "@material-ui/core";

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import 'typeface-roboto';

import Progress from '/client/imports/genericReactComponents/progress'; 
import CustomizedSnackbar from '/client/imports/genericReactComponents/customizedSnackbar'; 

import MostrarPagosAnticipoSimpleTable from './mostrarPagosAnticipadosSimpleTable'; 

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

class CenteredGrid extends React.Component {

    constructor(props) { 

        super(props); 

        this.state = {
            showProgress: false, 
            showMessage: false, 
            messageType: "",            // one of: success, warning , error, info        
            message: "", 
            error: false, 
            pagosAnticipo: this.props.pagosAnticipo, 
            selectedIndex: null, 
            selectedRow: null, 
        } 

        this.handle_descargarPagoSaldoFactura_click = this.handle_descargarPagoSaldoFactura_click.bind(this); 
        this.setListIndex = this.setListIndex.bind(this); 
        this.closeMessage = this.closeMessage.bind(this); 
    }

    closeMessage() { 
        this.setState({ 
            showMessage: false, 
            messageType: "",  
        }); 
    }

    handle_descargarPagoSaldoFactura_click() {
        const selectedRow = this.state.selectedRow; 

        if (!selectedRow) { 
            const message = "Ud. debe seleccionar un <em>pago de anticipo</em> en la lista, antes de hacer un click en el botón."; 
            this.setState({ 
                showMessage: true, 
                error: true, 
                message: message, 
                messageType: "error", 
            });

            return; 
        } 

        if (!selectedRow.monto) { 
            const message = `El pago de anticipo seleccionado en la lista <b>no tiene</b> un monto registrado.
                             Los pagos de anticipo que se registren en el programa deben tener un monto. 
                             Por favor consulte el pago seleccionado y registre un monto para el mismo.  
                             Luego, puede asociar la factura al mismo en forma <em>manual</em>, como se haría con cualquier pago. 
                            `; 
            this.setState({ 
                showMessage: true, 
                error: true, 
                message: message, 
                messageType: "error", 
            });

            return; 
        } 

        const message = ""; 
        this.setState({ 
            showProgress: true,
            showMessage: false, 
            error: false, 
        });

        const pagoId = selectedRow._id; 
        const facturaId = this.props.facturaId; 
        const montoAnticipo = selectedRow.monto; 

        pagosAnticipo_aplicarAFactura(pagoId, facturaId, montoAnticipo)
            .then(result => {
                
                // eliminamos de la lista, el pago que se ha aplicado; así nos aseguramos que el usuario no se equivoque y lo vuelva 
                // a aplicar 
                const pagosAnticipo = this.state.pagosAnticipo.filter(p => p._id != pagoId); 

                this.setState({
                    showProgress: false,
                    error: false, 
                    pagosAnticipo: pagosAnticipo, 
                    showMessage: true,  
                    message: result.message, 
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
    }

    setListIndex(idx) {
        // el usuario seleccionó un row en la lista; lo registramos en el state ... 
        // si el usuario 'deselecciona', el index debe venir en nulls ... 

        // cuando no hay un row seleccionado en la lista, el idx es null 
        this.setState({ 
            selectedIndex: idx, 
            selectedRow: idx != null ? this.props.pagosAnticipo[idx] : null, 
        })
    }

    render() {
        const { classes, theme } = this.props;

        return (
            <div className={classes.root}>
                <Grid container spacing={1}>
                    <Grid item xs={12}>
                        <Paper square style={{ padding: '10px', }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} style={{ textAlign: 'center' }}> 
                                    { this.state.showProgress ? <Progress />  : '' }
                                    { this.state.showMessage ? <CustomizedSnackbar variant={this.state.messageType} 
                                                                                message={this.state.message} 
                                                                                close={this.closeMessage} /> : '' }
                                </Grid>
                                <Grid item xs={12}>
                                    <Paper>
                                        <MostrarPagosAnticipoSimpleTable rows={this.state.pagosAnticipo}
                                                                        setListIndex={this.setListIndex} />
                                    </Paper>
                                </Grid>

                                <Grid item xs={4}>
                                </Grid>

                                <Grid item xs={4}>
                                </Grid>

                                <Grid item xs={1}>
                                </Grid>
                                <Grid item xs={3}>
                                    <Button variant="contained" color="primary" onClick={this.handle_descargarPagoSaldoFactura_click}>
                                        Descargar pago del saldo de la factura ...
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

CenteredGrid.propTypes = {
    classes: PropTypes.object.isRequired,
    pagosAnticipo: PropTypes.arrayOf(PropTypes.object).isRequired, 
    facturaId: PropTypes.number.isRequired, 
}

export default withStyles(styles, { withTheme: true})(CenteredGrid);

// meteor method para aplicar el pago a la factura y reducir el monto de su saldo pendiente 
const pagosAnticipo_aplicarAFactura = (pagoId, facturaId, montoAnticipo) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('bancos.facturas.pagosAnticipo.aplicar', pagoId, facturaId, montoAnticipo, (err, result) => {

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