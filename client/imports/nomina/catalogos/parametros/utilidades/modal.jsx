

import React from "react";
import PropTypes from 'prop-types';
import lodash from 'lodash'; 

import { Grid, Row, Col, } from 'react-bootstrap';
import { FormGroup, FormControl, ControlLabel, Button, Checkbox } from 'react-bootstrap';
import { Modal } from 'react-bootstrap'; 

import { Formik, Form } from 'formik';
import moment from 'moment'; 


export default function ShowItemModal({ showModal, handleClose, selectedItem, }) { 

    console.log("(from formik) selected item: ", selectedItem) 

    return (
        <Modal show={showModal} onHide={handleClose} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title>Nómina / Parámetros / Definición de utilidades</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div>
                    <Formik
                        initialValues={selectedItem}
                        onSubmit={(values, actions) => {
                            // this could also easily use props or other
                            // local state to alter the behavior if needed
                            // this.props.sendValuesToServer(values)

                            actions.setSubmitting(false)

                            if (!values.docState) { 
                                values.docState = 2;        // para indicar que el usuario editó el item en la lista 
                            }

                            handleClose(values); 
                          }}

                          render={({ values,
                                     errors,
                                     touched,
                                     handleChange,
                                     handleBlur,
                                     handleSubmit,
                                     isSubmitting,
                                     setFieldTouched, 
                                     setFieldValue, 
                                     dirty
                                    /* and other goodies */
                            }) => (
                        
                                <Form id="myForm" onSubmit={handleSubmit}>
                                    <Grid fluid={true}>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Grupo de nómina:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        id="grupoNomina"
                                                        name="grupoNomina"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.grupoNomina}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>F nómina:</ControlLabel>
                                                    <FormControl
                                                        type="date"
                                                        id="fechaNomina"
                                                        name="fechaNomina"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={moment(values.fechaNomina).toDate()}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup controlId="formControlsSelect">
                                                    <ControlLabel>Base de aplicación:</ControlLabel>
                                                    <FormControl componentClass="select" 
                                                                 id="baseAplicacion"
                                                                 name="baseAplicacion"
                                                                 onChange={handleChange}
                                                                 onBlur={handleBlur}
                                                                 placeholder="Sueldo/salario ...">
                                                        <option value="1">Sueldo</option>
                                                        <option value="2">Salario</option>
                                                    </FormControl>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Desde:</ControlLabel>
                                                    <FormControl
                                                        type="date"
                                                        id="desde"
                                                        name="desde"
                                                        onBlur={handleBlur}
                                                        value={values.desde}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Hasta:</ControlLabel>
                                                    <FormControl
                                                        type="date"
                                                        id="hasta"
                                                        name="hasta"
                                                        onBlur={handleBlur}
                                                        value={values.hasta}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Cant meses:</ControlLabel>
                                                    <FormControl
                                                        type="number" 
                                                        min="0" 
                                                        step="1"
                                                        id="cantidadMesesPeriodoPago"
                                                        name="cantidadMesesPeriodoPago"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.cantidadMesesPeriodoPago}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Cant días:</ControlLabel>
                                                    <FormControl
                                                        type="number" 
                                                        min="0" 
                                                        step="1"
                                                        id="cantidadDiasPeriodoPago"
                                                        name="cantidadDiasPeriodoPago"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.cantidadDiasPeriodoPago}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Cant días utilidades:</ControlLabel>
                                                    <FormControl
                                                        type="number" 
                                                        min="0" 
                                                        step="1"
                                                        id="cantidadDiasUtilidades"
                                                        name="cantidadDiasUtilidades"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.cantidadDiasUtilidades}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <Checkbox id="aplicarInce" 
                                                          name="aplicarInce" 
                                                          value={values.aplicarInce}
                                                          onChange={handleChange}
                                                          onBlur={handleBlur}>
                                                    Aplicar Ince
                                                </Checkbox>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Ince %:</ControlLabel>
                                                    <FormControl
                                                        type="number"
                                                        id="incePorc"
                                                        name="incePorc"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.incePorc}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup>
                                                    <ControlLabel>Cia Contab:</ControlLabel>
                                                    <FormControl.Static>{values.abreviaturaCompania}</FormControl.Static>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={3} smOffset={9}>
                                                <Button bsStyle="primary" 
                                                        bsSize="small" 
                                                        type="submit" 
                                                        disabled={isSubmitting || !lodash.isEmpty(errors) || !dirty}>
                                                    Cerrar (mantener cambios)
                                                </Button>
                                            </Col>
                                        </Row>

                                    </Grid>

                                </Form>
                            )}
                    />
                </div>

            </Modal.Body>
            <Modal.Footer style={{ paddingRight: "30px" }}>
                {/* <Button onClick={handleClose}>Cerrar</Button> */}
                <h3>Ok, this is the modal footer ...</h3>
            </Modal.Footer>
        </Modal>
    ); 
}


ShowItemModal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    selectedItem: PropTypes.object.isRequired,
}