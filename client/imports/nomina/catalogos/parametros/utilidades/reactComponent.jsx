

import React from "react";
import PropTypes from 'prop-types';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import { Meteor } from 'meteor/meteor';
import moment from 'moment'; 

import { Grid, Row, Col, } from 'react-bootstrap';
import { Alert } from 'react-bootstrap'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

import NavBar from './toolBar'; 
import ShowItemModal from './modal'; 

import "./styles"; 

const DelTableRow = ({handleDeleteTableRow, itemID}) => { 
    return (
        <div>
            <span className="fa fa-close redOnHover" style={{ paddingTop: '0', paddingRight: '12px', }}
                  onClick={e => { e.preventDefault(); handleDeleteTableRow(itemID); }} /> 
        </div>
    )
}

DelTableRow.propTypes = {
    handleDeleteTableRow: PropTypes.func.isRequired,
    itemID: PropTypes.number.isRequired,
}

const ShowDocStateColumn = ({docState}) => { 

    switch (docState) { 
        case 1: 
            return <div className="fa fa-asterisk" style={{color: 'blue', font: 'xx-small', paddingTop: '0', backgroundColor: 'gray', }} />;  
        case 2: 
            return <div className="fa fa-pencil" style={{color: 'brown', font: 'xx-small', paddingTop: '0', backgroundColor: 'gray', }} />;  
        case 3: 
            return <div className="fa fa-trash" style={{color: 'red', font: 'xx-small', paddingTop: '0', backgroundColor: 'gray', }} />;  
        default: 
            return <div style={{paddingTop: '0', backgroundColor: 'gray', }} />;  
    }
}

ShowDocStateColumn.propTypes = {
    docState: PropTypes.number
}



export default class NominaParametrosDefinicionUtilidades extends React.Component {

    constructor(props) {
        super(props);

        this._companiaSeleccionada = leerCompaniaSeleccionada(); 

        this.state = {

            showAlert: false,
            alertType: "info",
            alertText: "",

            loading: false,

            items: [],
            itemCount: 0,
            pagina: 1,

            gruposNomina: [], 

            showModal: false,
            selectedItemIndex: null,
            selectedItem: {},
        };
        
        this.handleModalShow = this.handleModalShow.bind(this);
        this.handleModalClose = this.handleModalClose.bind(this);
        this.handleAlertDismiss = this.handleAlertDismiss.bind(this);   

        this.componentDidMount = this.componentDidMount.bind(this); 
        this.leerPaginaDesdeServer = this.leerPaginaDesdeServer.bind(this);    
        this.handleClickToolbarButton = this.handleClickToolbarButton.bind(this);
    }

    handleModalShow() {
        this.setState({ showModal: true });
    }

    handleModalClose(values) {
        // cuando el usuario hace submit en formik en el modal, se regresan los valores (editados) ... 

        if (values) { 
            // nótese que el usuario puede cerrar el modal *sin* grabar valores editados 

            console.log("(from parent component / after submit from formik) values: ", values) 

            const items = this.state.items; 
            items[this.state.selectedItemIndex] = values; 
            this.setState({ items: items })
        }

        this.setState({ showModal: false });
    }

    handleAlertDismiss() {
        this.setState({ showAlert: false, });
    }

    async componentDidMount() {

        // el usuario indica un filtro (no en este caso); leemos la 1ra página 

        this.setState({
            pagina: 1,
            loading: true,
        });

        // mas: tipo de opción: 1 página más. cómo esta es la 1ra lectura, en realidad no importa 

        let result1 = {}; 
        let result2 = {}; 

        try { 

            result1 = await leerDatosRelacionados(this._companiaSeleccionada.numero); 
            result2 = await leerRegistrosFromServer_1raPagina(this.state.pagina, this._companiaSeleccionada.numero); 

            console.log("items (before converting dates): ", result2.items) 

            // las fechas vienen serializadas como strings; convertimos nuevamente a dates
            result2.items.forEach((x) => { 
                x.fechaNomina = x.fechaNomina ? moment(x.fechaNomina).toDate() : null;
                x.desde = x.desde ? moment(x.desde).toDate() : null;
                x.hasta = x.hasta ? moment(x.hasta).toDate() : null;
            })

            console.log("items (after converting dates): ", result2.items) 
            

            this.setState({
                alertType: "info",
                alertText: result2.message,
                showAlert: true,
                loading: false,
                items: result2.items,
                itemsCount: result2.itemsCount,
                gruposNomina: result1.gruposNomina, 
            });

            console.log("items: ", result2.items) 

        } catch(error) { 

            this.setState({
                alertType: "danger",
                alertText: `Ha ocurrido un error al intentar leer los registros desde la base de datos: <br />
                                    ${error.message}
                                   `,
                showAlert: true,
                loading: false,
            });
        }
    }

    handleClickToolbarButton(opcion) { 
        switch (opcion) {
            case "grabar":
                this.leerPaginaDesdeServer("");
                break;
            case "nuevo":
                this.leerPaginaDesdeServer("");
                break;
            case "registroNomina":
                this.leerPaginaDesdeServer("");
                break;
            case "mas":
                this.leerPaginaDesdeServer("mas");
                break;
            case "todo":
                this.leerPaginaDesdeServer("todo");
                break;
        }
    }

    leerPaginaDesdeServer(tipoOpcion) {

        // el usuario ya indico un filtro y se regresó la 1ra página; ahora hizo: más / todo 
        // tipoOpcion: más (otra página) / todo: resto 

        const { pagina } = this.state;

        this.setState({
            pagina: pagina + 1,
            loading: true,
        }, () => this.leerPaginaDesdeServer2(tipoOpcion))       // nos aseguramos que el state esté actualizado 
    }

    leerPaginaDesdeServer2(tipoOpcion) {

        // tipoOpcion: más (otra página) / todo: resto 
        leerRegistrosFromServer_otrasPaginas(this.state.pagina,
            this._companiaSeleccionada.numero,
            tipoOpcion,
            this.state.itemsCount)
            .then((result) => {

                // las fechas vienen serializadas como strings; convertimos nuevamente a dates
                result.items.forEach((x) => { 
                    x.fechaNomina = x.fechaNomina ? moment(x.fechaNomina).toDate() : null;
                    x.desde = x.desde ? moment(x.desde).toDate() : null;
                    x.hasta = x.hasta ? moment(x.hasta).toDate() : null;
                })

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

    handleDeleteTableRow(itemID) { 
        // en itemID viene el id del item en la lista. Lo marcamos como eliminado!
        const items = this.state.items; 
        const idx = items.findIndex(x => x.id === itemID); 

        if (idx >= 0) { 
            items[idx].docState = 3; 
            this.setState({ items: items }); 
        }
    }


    render() {

        const columns = [
            { 
                Header: () => (<div></div>),  
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parÃƒÂ¡metros aquÃƒÂ­ ... 
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                id: "docState",
                accessor: d => <ShowDocStateColumn docState= {d.docState} />, 
                className: "fontSmall alignCenter", 
                width: 35, 
            }, 
            {
                Header: () => (<div>Grupo de<br />nómina</div>),
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parámetros aquí ... 
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'left',
                            fontSize: 'small', 
                        }
                    }
                },
                id: "grupoNomina",
                accessor: (d) => { 
                    const grupoNomina = this.state.gruposNomina.find(x => x.grupo === d.grupoNomina);
                    let descripcion = "Indefinido (???)"; 

                    if (grupoNomina) { 
                        descripcion = grupoNomina.descripcion; 
                    }

                    return descripcion; 
                },
                className: "fontXSmall alignLeft"
            },
            {
                Header: () => (<div>Fecha<br />nómina</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'center',
                            fontSize: 'small', 
                        }
                    }
                },
                id: "fechaNomina",
                accessor: d => moment(d.fechaNomina).format("DD-MMM-YY"),
                className: "fontXSmall",
                width: 80
            },
            {
                Header: () => (<div>Desde</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'center',
                            fontSize: 'small', 
                            paddingTop: '12px',
                        }
                    }
                },
                id: "desde",
                accessor: d => moment(d.desde).format("DD-MMM-YY"),
                className: "fontXSmall",
                width: 80
            },
            {
                Header: () => (<div>Hasta</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'center',
                            fontSize: 'small', 
                            paddingTop: '12px',
                        }
                    }
                },
                id: "hasta",
                accessor: d => moment(d.hasta).format("DD-MMM-YY"),
                className: "fontXSmall",
                width: 80
            },
            {
                Header: () => (<div>Cant meses<br />período pago</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'center',
                            fontSize: 'small', 
                            verticalAlign: 'middle',
                        }
                    }
                },
                id: "cantidadMesesPeriodoPago",
                accessor: d => d.cantidadMesesPeriodoPago,
                className: "fontXSmall alignCenter"
            },
            {
                Header: () => (<div>Cant días<br />período pago</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'center',
                            fontSize: 'small', 
                            verticalAlign: 'middle',
                        }
                    }
                },
                id: "cantidadDiasPeriodoPago",
                accessor: d => d.cantidadDiasPeriodoPago,
                className: "fontXSmall alignCenter"
            },
            {
                Header: () => (<div>Cant días<br />utilidades</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'center',
                            fontSize: 'small', 
                        }
                    }
                },
                id: "cantidadDiasUtilidades",
                accessor: d => d.cantidadDiasUtilidades,
                className: "fontXSmall alignCenter"
            },
            {
                Header: () => (<div>Base de<br />aplicación</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'left',
                            fontSize: 'small', 
                        }
                    }
                },
                id: "baseAplicacion",
                accessor: (d) => { 
                    let descripcion = ""; 

                    switch(d.baseAplicacion) { 
                        case 1: 
                            descripcion = 'Sueldo'; 
                            break; 
                        case 2: 
                            descripcion = 'Salario'; 
                            break; 
                        default: 
                            descripcion = "Indefinido (???)"; 
                    }

                    return descripcion; 
                },
                className: "fontXSmall alignLeft"
            },
            {
                Header: () => (<div>Aplicar<br />ince</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'center',
                            fontSize: 'small', 
                        }
                    }
                },
                id: "aplicarInce",
                accessor: d => d.aplicarInce ? 'Si' : 'No',
                className: "fontXSmall alignCenter"
            },
            {
                Header: () => (<div>Ince %</div>),
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            textAlign: 'center',
                            fontSize: 'small', 
                        }
                    }
                },
                id: "incePorc",
                accessor: d => d.incePorc,
                className: "fontXSmall alignCenter"
            },
            {
                Header: 'Cia Contab',
                getHeaderProps: () => {
                    return {
                        style: {
                            background: '#ECECEC',
                            color: '#6B6B6B',
                            paddingTop: '12px',
                            textAlign: 'left',
                            fontSize: 'small', 
                        }
                    }
                },
                accessor: 'abreviaturaCompania',
                className: "fontXSmall alignLeft"
            },
            { 
                Header: () => (<div></div>),  
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parÃƒÂ¡metros aquÃƒÂ­ ... 
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                id: "delRow",
                Cell: props => <DelTableRow handleDeleteTableRow={this.handleDeleteTableRow} itemID={props.original.id} />, 
                className: "fontSmall alignCenter", 
                width: 35, 
            }, 

        ]; 

        return (
            <>
                <ShowItemModal showModal={this.state.showModal} handleClose={this.handleModalClose} selectedItem={this.state.selectedItem} />

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

                    <Row style={{ marginTop: "5px" }}>
                        <Col sm={12} smOffset={0}>
                            <NavBar handleClickToolbarButton={this.handleClickToolbarButton} />
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

                                    // getTrProps={(state, rowInfo) => {
                                    //     return {
                                    //         onClick: (e, handleOriginal) => {
                                    //             const item = this.state.items[rowInfo.index]; 

                                    //             console.log("item: ", item) 

                                    //             this.setState({
                                    //                 showModal: true,
                                    //                 selectedItemIndex: rowInfo.index,
                                    //                 selectedItem: item, 
                                    //             });

                                    //             // IMPORTANT! React-Table uses onClick internally to trigger
                                    //             // events like expanding SubComponents and pivots.
                                    //             // By default a custom 'onClick' handler will override this functionality.
                                    //             // If you want to fire the original onClick handler, call the
                                    //             // 'handleOriginal' function.
                                    //             if (handleOriginal) {
                                    //                 handleOriginal();
                                    //             }
                                    //         }
                                    //     };
                                    // }}


                                    getTdProps={(state, rowInfo, column, instance) => {
                                        return {
                                          onClick: (e, handleOriginal) => {
                                            // console.log('A Td Element was clicked!')
                                            // console.log('this is the state: ', state)
                                            // console.log('it produced this event:', e)
                                            // console.log('it was in this column:', column)
                                            // console.log('it was in this row:', rowInfo)
                                            // console.log('it was in this table instance:', instance)

                                            console.log('column.id: ', column.id)
                                            console.log('row.original: ', rowInfo.original)
                                            console.log('row index: ', rowInfo.index)



                                            // fácilmente, podemos saber cual fue el column al cual se hizo el click 
                                            // console.log('it was in this column:', column)
                                            // console.log('it was in this row:', rowInfo)
                                            if (column.id !== 'delRow') { 

                                                // abrimos el modal solo si el click no fue en X (del row)
                                                const item = this.state.items[rowInfo.index];

                                                console.log("item: ", item)

                                                this.setState({
                                                    showModal: true,
                                                    selectedItemIndex: rowInfo.index,
                                                    selectedItem: item,
                                                });
                                            } else { 
                                                // el usuario marcó un item en la lista como deleted 
                                                const items = this.state.items; 
                                                const item = items[rowInfo.index]; 

                                                if (item.docState !== 3) { 
                                                    item.docState = 3; 

                                                    this.setState({
                                                        items: items, 
                                                        selectedItemIndex: rowInfo.index,
                                                        selectedItem: item,
                                                    });
                                                }
                                            }
                                                
                                     
                                            // IMPORTANT! React-Table uses onClick internally to trigger
                                            // events like expanding SubComponents and pivots.
                                            // By default a custom 'onClick' handler will override this functionality.
                                            // If you want to fire the original onClick handler, call the
                                            // 'handleOriginal' function.
                                            if (handleOriginal) {
                                              handleOriginal()
                                            }
                                          }
                                        }
                                      }}
                                />

                            </Col>
                        </Row>
                </Grid>
            </>
        )
    }
}

NominaParametrosDefinicionUtilidades.propTypes = {
    tituloPagina: PropTypes.string.isRequired, 
}

function leerCompaniaSeleccionada() {

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada (nótese que, hasta ahora, estos datos están en minimongo)
    const companiaSeleccionadaUsuario = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionada = {};

    if (companiaSeleccionadaUsuario) {
        companiaSeleccionada = Companias.findOne(companiaSeleccionadaUsuario.companiaID, { fields: { numero: true, nombre: true } });
    }

    return companiaSeleccionada;
}

const leerRegistrosFromServer_1raPagina = (pag, ciaContabSeleccionadaID) => {

    return new Promise((resolve, reject) => {

        Meteor.call('nominaParametrosDefinicionUtilidadesLeerDesdeSql_1raPagina', pag, ciaContabSeleccionadaID, (err, result) => {

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

const leerRegistrosFromServer_otrasPaginas = (pag, ciaContabSeleccionadaID, tipoOpcion, itemsCount) => {

    return new Promise((resolve, reject) => {

        Meteor.call('nominaParametrosDefinicionUtilidadesLeerDesdeSql_pagina_resto', pag, 
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


const leerDatosRelacionados = (ciaContabSeleccionadaID) => {

    return new Promise((resolve, reject) => {

        Meteor.call('nominaParametrosDefinicionUtilidades_leerDatosRelacionados', 
                                                                 ciaContabSeleccionadaID, 
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