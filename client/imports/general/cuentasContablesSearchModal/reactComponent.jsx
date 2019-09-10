

import React from "react"; 
import PropTypes from 'prop-types';

import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.min.css';

import "./styles.css"; 

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import Button from 'react-bootstrap/lib/Button';
import Modal from 'react-bootstrap/lib/Modal';
import Table from 'react-bootstrap/lib/Table';      
import Panel from 'react-bootstrap/lib/Panel'; 
   
import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';

const TableRow = ({ idx, item }) => { 
        
    const row = (<tr> 
                    <td>{item.id}</td>
                    <td>{item.descripcion}</td>
                </tr>); 

    return row; 
}

export default class CuentasContablesSearchModal extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.handleShow = this.handleShow.bind(this);
        this.handleClose = this.handleClose.bind(this);

        this.state = {
            show: false, 

            cuentasContables: [ ], 

            cuentasTypeAheadOptions: { 
                allowNew: false,
                isLoading: false,
                minLength: 4, 
                options: [ ],          
                multiple: false, 
            }, 

            openInfoPanel: false, 
        };
    }

    handle_infoPopover_toggle = () => {
        this.setState({ showInfoPopover: !this.state.showInfoPopover });
    }

    handleClose() {
        this.setState({ show: false });
        this.props.agregarCuentasContablesLeidasDesdeSql(this.state.cuentasContables); 
    }

    handleShow() {
        this.setState({ show: true });
    }

    handleCuentasTypeAheadSearch = (query) => { 

        // como el state contiene inner objects, nos aseguramos que el setState se ejecute en forma correcta 
        let cuentasTypeAheadOptions = JSON.parse(JSON.stringify(this.state.cuentasTypeAheadOptions))
        cuentasTypeAheadOptions.isLoading = true; 
        this.setState({cuentasTypeAheadOptions}) 

        leerCuentasContablesFromServer(query, this.props.ciaContabSeleccionada)
            .then((options) => { 

                // como el state contiene inner objects, nos aseguramos que el setState se ejecute en forma correcta 
                let cuentasTypeAheadOptions = JSON.parse(JSON.stringify(this.state.cuentasTypeAheadOptions))

                cuentasTypeAheadOptions.isLoading = false; 
                cuentasTypeAheadOptions.options = options; 

                this.setState({cuentasTypeAheadOptions}); 
            })
    }

    handleShowInfoPanel = () => { 
        const openInfoPanel = !this.state.openInfoPanel; 
        this.setState({ openInfoPanel: openInfoPanel, })
    }

    render() {
        
        return (
            <div>
                <span onClick={this.handleShow}>Cuentas contables&nbsp;&nbsp;<span className="fa fa-desktop"></span></span>
   
                <Modal show={this.state.show} onHide={this.handleClose}>

                    <Modal.Header closeButton>
                        <Modal.Title>Cuentas contables</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Grid fluid={true}>

                            <Row>
                                <Col sm={1} smOffset={8}>
                                    <a href="#" className="navbar_custom_small_node">
                                        <span onClick={this.handleShowInfoPanel} className="fa fa-info-circle"></span>
                                    </a>
                                </Col>
                                <Col sm={3}>
                                    <div style={{ textAlign: 'right', fontStyle: 'italic', }}>
                                        <span style={{ color: 'dodgerblue' }}>{this.props.ciaContabSeleccionada.nombreCorto}</span>
                                    </div>
                                </Col>
                            </Row>

                            <Row>
                                <Col sm={12}>
                                    <InfoPanel openInfoPanel={this.state.openInfoPanel} handleShowInfoPanel={this.handleShowInfoPanel}></InfoPanel>
                                </Col>
                            </Row>

                            <Row>
                                <Col sm={12} smOffset={0}>
                                    <Row>
                                        <Col sm={12} smOffset={0}>
                                            <FormGroup bsSize="small">
                                                <ControlLabel>Cuenta contable: </ControlLabel>
                                                <AsyncTypeahead
                                                    id={"cuentaContable_typeAhead"}
                                                    {...this.state.cuentasTypeAheadOptions}

                                                    // para obtener un ref del control; nótese como lo usamos más abajo para hacer un clear()
                                                    ref={(typeahead) => this.cuentasTypeahead = typeahead}

                                                    // nos aseguramos que este valor sea siempre un string; por ejemplo, no un null ... 
                                                    defaultInputValue={''}

                                                    // fires when user selects an item from the list 
                                                    onChange={(selected) => {
                                                        // cada vez que el usuario selecciona una cuenta, la agregamos al array en el 
                                                        // state (y mostramos en la tabla, pues el array y los rows están relacionados) 
                                                        if (selected && Array.isArray(selected) && selected.length) {
                                                            let items = this.state.cuentasContables;
                                                            const item = selected[0];

                                                            // solo agregamos si no existe 
                                                            const existe = items.some(x => x.id == item.id);

                                                            if (!existe) {
                                                                items.push(item);
                                                                this.setState({ cuentasContables: items });
                                                            }

                                                            // para limmpiar el input y que el usuario pueda empezar a hacer otra 
                                                            // busqueda sin tener que, en forma manual, limpiar el contenido del input 
                                                            this.cuentasTypeahead.getInstance().clear();
                                                        }
                                                    }}

                                                    onSearch={this.handleCuentasTypeAheadSearch}
                                                    labelKey="descripcion" />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col sm={12}>
                                            <div className="table-wrapper">
                                                <Table striped bordered condensed hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Descripción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            this.state.cuentasContables.map((item, idx) => {
                                                                return (
                                                                    <TableRow
                                                                        key={idx}
                                                                        idx={idx}
                                                                        item={item}
                                                                    />)
                                                            })
                                                        }
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Col>
                                    </Row>

                                </Col>
                            </Row>
                        </Grid>
                    </Modal.Body>

                    <Modal.Footer>
                        <div style={{ textAlign: 'center', }}>
                            <Button bsStyle="primary" onClick={this.handleClose} bsSize="small">
                                Agregar cuentas contables seleccionadas
                            </Button>
                        </div> 
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

CuentasContablesSearchModal.propTypes = {
    ciaContabSeleccionada: PropTypes.object.isRequired, 
    agregarCuentasContablesLeidasDesdeSql: PropTypes.func.isRequired
}


// meteor method para agregar opciones al search de cuentas contables ... 
const leerCuentasContablesFromServer = (search, ciaContabSeleccionada) => { 
    return new Promise((resolve, reject) => { 

        Meteor.call('contab.cuentasContables.searchDesdeSql', search, ciaContabSeleccionada.numero, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result.error) { 
                reject(result); 
            }
    
            resolve(result.cuentasContables)
        })
    })
}

function InfoPanel({ openInfoPanel, handleShowInfoPanel }) {

    return (
        <Panel id="infoPanel" expanded={openInfoPanel} onToggle={()=>{}} style={{ borderColor: "white", }}>
            <Panel.Collapse>
                <Panel.Heading>
                    <Panel.Title componentClass="h3">Cuentas contables - Buscar y traer desde el servidor</Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <p>
                        El objetivo de esta función es leer y <em>traer</em> cuentas contables
                        desde el servidor al navegador.
                    </p>
                    <p>
                        La idea es tener disponibles las cuentas contables que necesite el
                        usuario, para completar la función que se esté ejecutando en el programa.
                    </p>
                    <p>
                        Digamos que el usuario quiere agregar una cuenta bancaria. Para cada
                        cuenta bancaria que se registre en el programa, se debe asociar su cuenta
                        contable. Para que las cuentas contables que el usuario necesite asociar estén
                        disponibles en el navegador, deben ser buscadas y traidas, desde el servidor,
                        usando este diálogo.
                    </p>
                    <p>
                        Una vez que el usuario ha seleccionado y traído las cuentas contables que
                        necesite, éstas estarán disponibles
                        en el navegador para ser usadas de la forma que sea conveniente.
                    </p>

                    <div style={{ textAlign: 'right', }}>
                        <a href="#" onClick={handleShowInfoPanel} className="navbar_custom_small_node">Cerrar</a>
                    </div>
                </Panel.Body>
            </Panel.Collapse>
        </Panel>
    )
}