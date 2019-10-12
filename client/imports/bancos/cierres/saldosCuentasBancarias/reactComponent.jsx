

import React from "react";
import PropTypes from 'prop-types';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import { Meteor } from 'meteor/meteor';
import numeral from 'numeral'; 

import { Grid, Row, Col, } from 'react-bootstrap';
import { Alert } from 'react-bootstrap'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

import NavBar from './toolBar'; 
import Search from './search'; 
import ShowItemModal from './modal'; 

import "./styles"; 

export default class SaldosCuentasBancarias extends React.Component {

    constructor(props) {
        super(props);

        this._companiaSeleccionada = leerCompaniaSeleccionada(); 

        this.state = { 

            search: '', 

            showAlert: false, 
            alertType: "info", 
            alertText: "", 

            loading: false,

            items: [], 
            itemCount: 0, 
            pagina: 1, 

            showModal: false, 
            selectedItemIndex: null, 
            selectedItem: {}, 
        }; 

        this.handleSearch = this.handleSearch.bind(this); 
        this.handleAlertDismiss = this.handleAlertDismiss.bind(this);           
        this.leerPaginaDesdeServer = this.leerPaginaDesdeServer.bind(this);    
        
        this.handleShow = this.handleShow.bind(this);
        this.handleClose = this.handleClose.bind(this);
  
    }

    handleClose() {
        this.setState({ showModal: false });
    }

    handleShow() {
        this.setState({ showModal: true });
    }

    handleAlertDismiss() {
        this.setState({ showAlert: false, }); 
    }

    handleSearch(search) { 

        // el usuario indica un filtro; leemos la 1ra página 

        this.setState({ 
            search: search, 
            pagina: 1, 
            loading: true, 
        });

        // mas: tipo de opción: 1 página más. cómo esta es la 1ra lectura, en realidad no importa 
        leerRegistrosFromServer_1raPagina(search, this.state.pagina, this._companiaSeleccionada.numero)
            .then((result) => { 

                this.setState({ 
                    alertType: "info", 
                    alertText: result.message,             
                    showAlert: true, 
                    loading: false, 
                    items: result.items, 
                    itemsCount: result.itemsCount, 
                });
            })
            .catch((error) => { 

                this.setState({ 
                    alertType: "danger", 
                    alertText: `Ha ocurrido un error al intentar leer los registros desde la base de datos: <br />
                                ${error.message}
                               `,             
                    showAlert: true, 
                    loading: false, 
                });

            }); 
    }
    
    leerPaginaDesdeServer(tipoOpcion) { 

        // el usuario ya indico un filtro y se regresó la 1ra página; ahora hizo: más / todo 
        // tipoOpcion: más (otra página) / todo: resto 

        const { pagina } = this.state; 

        this.setState({
            pagina: pagina + 1,          
            loading: true, 
        },  () => this.leerPaginaDesdeServer2(tipoOpcion))
    }

    leerPaginaDesdeServer2(tipoOpcion) { 

        // tipoOpcion: más (otra página) / todo: resto 

        leerRegistrosFromServer_otrasPaginas(this.state.search, 
                                                this.state.pagina, 
                                                this._companiaSeleccionada.numero, 
                                                tipoOpcion, 
                                                this.state.itemsCount)
        .then((result) => { 

            // agregamos los registros leídos a los que ya existían 
            const totalItems = this.state.items.concat(result.items); 

            this.setState({ 
                alertType: "info", 
                alertText: `${result.message} - total leídos: <b>${totalItems.length}</b>`,             
                showAlert: true, 
                loading: false, 
                items: totalItems, 
            });
        })
        .catch((error) => { 

            this.setState({ 
                alertType: "danger", 
                alertText: `Ha ocurrido un error al intentar leer los registros desde la base de datos: <br />
                            ${error.message}
                            `,             
                showAlert: true, 
                loading: false, 
            });

        }); 
    }

    render() {

        const columns = [
            { 
                Header: () => (<div>Cuenta</div>),  
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parámetros aquí ... 
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                id: "cuentaBancaria",
                accessor: d => d.cuentaBancaria,
                className: "fontXSmall alignLeft"
            }, 
            { 
                Header: () => (<div>Tipo</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'center', 
                      }
                    }
                }, 
                id: "tipo", 
                accessor: d => d.tipo,
                className: "fontXSmall", 
                width: 80
            }, 
            { 
                Header: () => (<div>Mon</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'center', 
                      }
                    }
                }, 
                id: "simboloMoneda",
                accessor: d => d.simboloMoneda,
                className: "fontXSmall", 
                width: 80
            }, 
            { 
                Header: () => (<div>Año</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'center', 
                      }
                    }
                }, 
                id: "ano",
                accessor: 'ano', 
                className: "fontXSmall", 
                width: 80
            },
            {
                Header: () => (<div>Inicial</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "inicial",
                accessor: d => numeral(d.inicial).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Enero</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes01",
                accessor: d => numeral(d.mes01).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Febrero</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes02",
                accessor: d => numeral(d.mes02).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Marzo</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes03",
                accessor: d => numeral(d.mes03).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Abril</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes04",
                accessor: d => numeral(d.mes04).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Mayo</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes05",
                accessor: d => numeral(d.mes05).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Junio</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes06",
                accessor: d => numeral(d.mes06).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Julio</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes07",
                accessor: d => numeral(d.mes07).format("#,##0.00"),
                className: "cellNumber" 
            }, 
            { 
                Header: () => (<div>Agosto</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes08",
                accessor: d => numeral(d.mes08).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Septiembre</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes09",
                accessor: d => numeral(d.mes09).format("#,##0.00"),
                className: "cellNumber" 
            }, 
            { 
                Header: () => (<div>Octubre</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes10",
                accessor: d => numeral(d.mes10).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Noviembre</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes11",
                accessor: d => numeral(d.mes11).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: () => (<div>Diciembre</div>), 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'right', 
                      }
                    }
                }, 
                id: "mes12",
                accessor: d => numeral(d.mes12).format("#,##0.00"),
                className: "cellNumber"
            }, 
            { 
                Header: 'Cia', 
                getHeaderProps: () => {       
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                accessor: 'abreviaturaCompania', 
                className: "fontXSmall alignLeft"
            }, 
        ]; 

        return (
            <div>

                <ShowItemModal showModal={this.state.showModal} handleClose={this.handleClose} selectedItem={this.state.selectedItem} />

                <Grid fluid={true}>
                    <Row>
                        <Col sm={4} smOffset={0}>
                            <h4 style={{ margin: '0 0 0 30', color: '#3183B9', textAlign: 'left', }}>{this.props.tituloPagina}</h4>
                        </Col>

                        <Col sm={4} smOffset={4} style={{ textAlign: 'right', fontStyle: 'italic', }}>
                            <span style={{ color: 'dodgerblue', }}>{this._companiaSeleccionada.nombre}</span>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={2} smOffset={5} style={{ textAlign: 'center' }}>
                            {
                                this.state.loading &&
                                <i style={{ color: 'lightgray' }} className="fa fa-circle-o-notch fa-spin fa-2x"></i>
                            }
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={12} style={{ textAlign: "left", }}>
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
                        <Col sm={6} smOffset={6} style={{ textAlign: 'right', }}>
                            <Search handleSearch={this.handleSearch} />
                        </Col>
                    </Row>
                    <Row style={{ marginTop: "5px" }}>
                        <Col sm={12} smOffset={0}>
                            <NavBar leerPaginaDesdeServer={this.leerPaginaDesdeServer} />
                        </Col>
                    </Row>

                    <Row style={{ marginTop: "5px" }}>
                        <Col sm={12} smOffset={0}>
                            <ReactTable data={this.state.items}
                                columns={columns}
                                defaultPageSize={10}
                                style={{
                                    // This will force the table body to overflow and scroll, since there is not enough room
                                    height: "400px"
                                }}
                                className="-striped -highlight"


                                getTrProps={(state, rowInfo) => {
                                    return {
                                        onClick: (e, handleOriginal) => {
                                            const item = this.state.items[rowInfo.index]; 

                                            this.setState({
                                                showModal: true,
                                                selectedItemIndex: rowInfo.index,
                                                selectedItem: item, 
                                            });

                                            // IMPORTANT! React-Table uses onClick internally to trigger
                                            // events like expanding SubComponents and pivots.
                                            // By default a custom 'onClick' handler will override this functionality.
                                            // If you want to fire the original onClick handler, call the
                                            // 'handleOriginal' function.
                                            if (handleOriginal) {
                                                handleOriginal();
                                            }
                                        }
                                    };
                                }}
                            />
                        </Col>
                    </Row>
                </Grid>

            </div>
        );
    }
}

SaldosCuentasBancarias.propTypes = {
    tituloPagina: PropTypes.string.isRequired, 
}

function leerCompaniaSeleccionada() {

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionadaUsuario = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionada = {};

    if (companiaSeleccionadaUsuario) {
        companiaSeleccionada = Companias.findOne(companiaSeleccionadaUsuario.companiaID, { fields: { numero: true, nombre: true } });
    }

    return companiaSeleccionada;
}

const leerRegistrosFromServer_1raPagina = (search, pag, ciaContabSeleccionadaID) => {

    return new Promise((resolve, reject) => {

        Meteor.call('cuentasBancariasLeerDesdeSql_1raPagina', search, pag, ciaContabSeleccionadaID, (err, result) => {

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

const leerRegistrosFromServer_otrasPaginas = (search, pag, ciaContabSeleccionadaID, tipoOpcion, itemsCount) => {

    return new Promise((resolve, reject) => {

        Meteor.call('cuentasBancariasLeerDesdeSql_pagina_resto', search, 
                                                                 pag, 
                                                                 ciaContabSeleccionadaID, 
                                                                 tipoOpcion, 
                                                                 itemsCount, 
                                                                 (err, result) => {
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