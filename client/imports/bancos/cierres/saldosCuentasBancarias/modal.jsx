

import React from "react";
import PropTypes from 'prop-types';

import numeral from 'numeral'; 

import { Grid, Row, Col, } from 'react-bootstrap';
import { FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap';
import { Modal } from 'react-bootstrap'; 

import { Formik, Form } from 'formik';

export default function ShowItemModal({ showModal, handleClose, selectedItem, }) { 

    return (
        <Modal show={showModal} onHide={handleClose} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title>Bancos / Saldos de cuentas bancarias</Modal.Title>
            </Modal.Header>
        <Modal.Body>
            

                <div>
                    <Formik
                        initialValues={selectedItem}
                    >
                        {({
                            values,
                            /* and other goodies */
                        }) => (
                                <Form>

                                    <Grid fluid={true}>
                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Cuenta bancaria:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="cuentaBancaria"
                                                        value={values.cuentaBancaria}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Moneda:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="simboloMoneda"
                                                        value={values.simboloMoneda}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Tipo:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="tipo"
                                                        value={values.tipo}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Año:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="ano"
                                                        value={values.ano}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Cia contab:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="abreviaturaCompania"
                                                        value={values.abreviaturaCompania}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Inicial:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="inicial"
                                                        value={numeral(values.inicial).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Enero:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes01"
                                                        value={numeral(values.mes01).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Febrero:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes02"
                                                        value={numeral(values.mes02).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Marzo:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes03"
                                                        value={numeral(values.mes03).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Abril:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes04"
                                                        value={numeral(values.mes04).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Mayo:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes05"
                                                        value={numeral(values.mes05).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Junio:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes06"
                                                        value={numeral(values.mes06).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Julio:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes07"
                                                        value={numeral(values.mes07).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Agosto:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes08"
                                                        value={numeral(values.mes08).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Septiembre:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes09"
                                                        value={numeral(values.mes09).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Octubre:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes10"
                                                        value={numeral(values.mes10).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Noviembre:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes11"
                                                        value={numeral(values.mes11).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4} smOffset={0}>
                                                <FormGroup bsSize="small">
                                                    <ControlLabel>Diciembre:</ControlLabel>
                                                    <FormControl
                                                        type="text"
                                                        name="mes12"
                                                        value={numeral(values.mes12).format("#,##0.00")}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                            </Col>

                                            <Col sm={4} smOffset={0}>
                                            </Col>
                                        </Row>
                                    </Grid>

                                </Form>
                            )}
                    </Formik>
                </div>

        </Modal.Body>
        <Modal.Footer style={{ paddingRight: "30px" }}>
            <Button onClick={handleClose}>Cerrar</Button>
        </Modal.Footer>
    </Modal>
    ); 
}

ShowItemModal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    selectedItem: PropTypes.object.isRequired,
}