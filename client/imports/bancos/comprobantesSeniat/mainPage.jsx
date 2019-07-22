

import React from 'react';
import { Grid, Paper, Button, } from "@material-ui/core";

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import 'typeface-roboto';

import Progress from '/client/imports/genericReactComponents/progress'; 
import CustomizedSnackbar from '/client/imports/genericReactComponents/customizedSnackbar'; 

import RowsFromSqlTableSimpleList from './rowsFromSqlTableList'; 

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
            showProgress: true, 
            showMessage: false, 
            messageType: "",            // one of: success, warning , error, info        
            message: "", 
            error: false, 
            items: [], 
            selectedIndex: null, 
            selectedRow: null, 
        } 

        this.setListIndex = this.setListIndex.bind(this); 
        this.closeMessage = this.closeMessage.bind(this); 
    }

    componentDidMount() {

        leerNumerosComprobanteSeniat(this.props.ciaContabSeleccionada)
               .then(function(result) { 
                   // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
                   this.setState({ showProgress: false, 
                                   numerosComprobantesSeniatList: [], 

                                   showMessage: true, 
                                   messageType: "info",            // one of: success, warning , error, info     
                                   items: result.items,    
                                   message: result.message, 
                                   error: false, 
                                 }); 
                }.bind(this))
               .catch(function(err) { 
                    this.setState({ showProgress: false, 
                                    numerosComprobantesSeniatList: [], 

                                    showMessage: true, 
                                    messageType: "error",            // one of: success, warning , error, info        
                                    items: [], 
                                    message: err.message, 
                                    error: true, 
                    })
                }.bind(this)) 
    }

    closeMessage() { 
        this.setState({ 
            showMessage: false, 
            messageType: "",  
        }); 
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
        const rows = this.state.items; 

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
                                        <RowsFromSqlTableSimpleList rows={rows} setListIndex={setListIndex} />
                                    </Paper>
                                </Grid>

                                <Grid item xs={4}>
                                </Grid>

                                <Grid item xs={4}>
                                </Grid>

                                <Grid item xs={1}>
                                </Grid>
                                <Grid item xs={3}>
                                    <Button variant="contained" color="primary">
                                        Grabar
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
    ciaContabSeleccionada: PropTypes.number.isRequired,  
}

export default withStyles(styles, { withTheme: true})(CenteredGrid);

// ------------------------------------------------------------------------------------------------------
// meteor method leer los números de comprobante (facturas) desde sql server 
const leerNumerosComprobanteSeniat = (ciaContab) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('bancos.facturas.numerosComprobanteSeniat.leerDesdeSql', ciaContab, (err, result) => {

            if (err) {
                reject(err); 
                return; 
            }
    
            if (result && result.error) { 
                reject(result); 
                return; 
            }
    
            resolve(result)
        })
    })
}