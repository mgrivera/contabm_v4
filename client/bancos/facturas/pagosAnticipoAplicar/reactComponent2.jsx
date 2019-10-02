

import React from "react";
import PropTypes from 'prop-types';

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import Button from 'react-bootstrap/lib/Button';            
import Alert from 'react-bootstrap/lib/Alert'; 
import Table from 'react-bootstrap/lib/Table';     

const TableRow = ({ idx, item, handleSelect }) => { 
            
    const fecha = new Intl.DateTimeFormat().format(item.fecha); 
    const monto = item.monto.toFixed(2); 

    const row = (<tr> 
                    <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" value={idx} onChange={handleSelect} checked={item.selected} />
                    </td>
                    <td>{item.proveedor}</td>
                    <td>{item.concepto}</td>
                    <td style={{ textAlign: 'center' }}>{fecha}</td>
                    <td>{item.numeroPago}</td>
                    <td style={{ textAlign: 'right' }}>{monto}</td>
                </tr>); 

    return row; 
}

export default class PagosAnticipoLista extends React.Component {

    constructor(props) {
        super(props);

        // recibimos los pagos de anticipo en this.props.pagosAnticipo; agregamos un nuevo valor que indica cual 
        // item ha sido seleccionado por el usuario 

        let pagosAnticipo = this.props.pagosAnticipo.map(pago => { 
            pago.selected = false; 
            return pago; 
        })

        this.state = { 

            showAlert: false, 
            alertType: "info", 
            alertText: "", 

            loading: false,
            pagosAnticipo: pagosAnticipo, 

            selectedRowIdx: -1, 
        }; 
    }

    handleAlertDismiss = () => {
        this.setState({ showAlert: false, }); 
    }

    handleButtonClick = () => { 

        const { selectedRowIdx, pagosAnticipo } = this.state; 

        if (selectedRowIdx == -1) { 
            this.setState({ 
                alertType: "danger", 
                alertText: `Ud. debe seleccionar un pago en la lista <b>antes</b> de hacer un click en este botón.`,             
                showAlert: true, 
            });

            return; 
        }

        const selectedRow = pagosAnticipo[selectedRowIdx]; 

        this.setState({ 
            loading: true, 
        });

        // ejecutamos el método que aplica el pago de anticipo seleccionado ... 
        const pagoId = selectedRow._id; 
        const facturaId = this.props.facturaId; 
        const montoAnticipo = selectedRow.monto; 

        pagosAnticipo_aplicarAFactura(pagoId, facturaId, montoAnticipo)
            .then((result) => { 

                // luego de aplicar el pago a la factura, lo quitamos de la lista 
                const pagosAnticipo2 = pagosAnticipo.filter((p, idx) => idx != selectedRowIdx); 

                this.setState({ 
                    selectedRowIdx: -1, 

                    alertType: "info", 
                    alertText: result.message,            
                    showAlert: true, 
                    loading: false, 

                    pagosAnticipo: pagosAnticipo2, 
                });

            })
            .catch((err) => { 

                this.setState({ 
                    alertType: "danger", 
                    alertText: `Ha ocurrido un mensaje de error mientras ejecutabamos esta función: <br /> 
                                ${err.message}`,             
                    showAlert: true, 
                    loading: false, 
                });
            });
    }

    handleSelect = (e) => {
        // el value en el checkbox siempre contiene un string; pero allí viene el index del item seleccionado
        // por eso, convertimos a number 
        const selectedIdx = e.target.checked ? Number(e.target.value) : -1;  

        // ponemos selected *solo* para el item seleccionado, cuyo index es selectedIdx
        // la idea es que, si hay otros items seleccionados, se deseccionen al cambiar aqui el state de cada item 

        let { pagosAnticipo } = this.state;
        
        let pagosAnticipo2 = pagosAnticipo.map((pago, idx) => { 

            pago.selected = false; 

            // seletedIdx es -1 cuando el usuario desmarca un item en la lista 
            if (selectedIdx != -1 && selectedIdx == idx) { 
                pago.selected = true; 
            }

            return pago; 
        }); 

        this.setState({ 
            selectedRowIdx: selectedIdx, 
            pagosAnticipo: pagosAnticipo2, 
        });
    }

    render() {

        return (
            <Grid fluid={true}>
                <Row>
                    <Col sm={2} smOffset={5} style={{ textAlign: 'center' }}>
                        {
                            this.state.loading && 
                            <i style={{ color: 'lightgray' }} className="fa fa-circle-o-notch fa-spin fa-2x"></i>
                        }
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        {this.state.showAlert &&
                            (
                                <Alert bsStyle={this.state.alertType} onDismiss={this.handleAlertDismiss}>
                                    <div dangerouslySetInnerHTML={{ __html: this.state.alertText }} />
                                </Alert>
                            )
                        }
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <Table striped bordered condensed hover responsive>
                            <thead>
                                <tr>
                                    <th>&nbsp;</th>
                                    <th>Proveedor</th>
                                    <th>Concepto</th>
                                    <th style={{ textAlign: 'center' }}>Fecha</th>
                                    <th>#Pago</th>
                                    <th style={{ textAlign: 'right' }}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.pagosAnticipo.map((pago, idx) => {
                                        return (
                                            <TableRow
                                                key={idx}
                                                idx={idx}
                                                item={pago}
                                                handleSelect={this.handleSelect}
                                            />)})
                                }
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                <Row>
                    <Col sm={5} smOffset={7}>
                        <Button bsStyle="primary" bsSize="small" onClick={this.handleButtonClick}>
                            Descargar pago del saldo de la factura ...
                        </Button>
                    </Col>
                </Row>
            </Grid>
        );
    }
}

PagosAnticipoLista.propTypes = {
    pagosAnticipo: PropTypes.arrayOf(PropTypes.object).isRequired, 
    facturaId: PropTypes.number.isRequired, 
}

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