

import React from "react";
import PropTypes from 'prop-types';
import { Formik } from 'formik';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.min.css';

import * as Yup from 'yup';

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';

import Button from 'react-bootstrap/lib/Button';            
import Alert from 'react-bootstrap/lib/Alert'; 

import { Companias } from '/imports/collections/companias';
import { Monedas } from '/imports/collections/monedas.js';
import { TiposProveedor } from '/imports/collections/bancos/catalogos'; 

// bootstrap 4: no podemos importarlo aquí pues toda la aplicación usa bs3; la idea es que, por ahora, 
// usemos react-bootstrap con la versión 3 ... 

// import '/node_modules/bootstrap/dist/css/bootstrap.min.css'; 

export default class DefinicionCuentasContables extends React.Component {

    companias = []; 
    monedas = [];  
    cuentasContables = [];  
    // proveedores = [];  
    conceptos = []; 
    tiposProveedor = []; 

    constructor(props) {
        super(props);

        companias = Companias.find({}, { sort: { abreviatura: 1 }, fields: { _id: 1, abreviatura: 1, }}).fetch(); 
        monedas = Monedas.find({}, { sort: { simbolo: 1 }, fields: { moneda: 1, simbolo: 1, }}).fetch(); 
        tiposProveedor = TiposProveedor.find({}, { sort: { descripcion: 1 } }).fetch();

        conceptos = [
            { id: 1, descripcion: "Compañías (CxP)" },
            { id: 2, descripcion: "Compras" },
            { id: 3, descripcion: "Impuestos retenidos" },
            { id: 4, descripcion: "Iva" },
            { id: 5, descripcion: "Retención s/Iva" },
            { id: 6, descripcion: "Otras" },
            { id: 7, descripcion: "Compañías (CxC)" },
            { id: 8, descripcion: "Ventas" },
            { id: 9, descripcion: "Iva por pagar" },
            { id: 10, descripcion: "Islr retenido por clientes" },
            { id: 11, descripcion: "Iva retenido por clientes" },
            { id: 12, descripcion: "Anticipo en pago de facturas" },
            { id: 13, descripcion: "Impuestos y retenciones varias (CxP)" },
            { id: 14, descripcion: "Impuestos y retenciones varias (CxC)" },
            { id: 15, descripcion: "Movimientos bancarios - comisiones" },
            { id: 16, descripcion: "Movimientos bancarios - impuestos" },
        ];

        this.state = { 
            showAlert: true, 

            proveedoresTypeAheadOptions: { 
                allowNew: false,
                isLoading: false,
                minLength: 4, 
                options: [ ],          
                multiple: false, 
            }, 

            cuentasTypeAheadOptions: { 
                allowNew: false,
                isLoading: false,
                minLength: 4, 
                options: [ ],          
                multiple: false, 
            }, 
        }; 
    }

    handleAlertDismiss = () => {
        this.setState({ showAlert: false, }); 
    }

    handleProveedoresTypeAheadSearch = (query) => { 

        // como el state contiene inner objects, nos aseguramos que el setState se ejecute en forma correcta 
        let proveedoresTypeAheadOptions = JSON.parse(JSON.stringify(this.state.proveedoresTypeAheadOptions))
        proveedoresTypeAheadOptions.isLoading = true; 
        this.setState({proveedoresTypeAheadOptions}) 

        leerProveedoresFromServer(query)
            .then((options) => { 

                // como el state contiene inner objects, nos aseguramos que el setState se ejecute en forma correcta 
                let proveedoresTypeAheadOptions = JSON.parse(JSON.stringify(this.state.proveedoresTypeAheadOptions))

                proveedoresTypeAheadOptions.isLoading = false; 
                proveedoresTypeAheadOptions.options = options; 

                this.setState({proveedoresTypeAheadOptions}); 
            })
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

    render() {
        
        const alertType = "info"; 
        let alertText = ""; 
        const docState = this.props.item && this.props.item.docState ? this.props.item.docState : 2; 
        
        if (!docState || docState == 2) { 
            alertText = `<p><strong>Está editando el registro</strong></p> 
                         <p>Edite el registro y haga un <em>click</em> en el botón. O cierre con la <em><b>x</b></em> para descartar cualquier edición.<br />   
                         Los cambios serán grabados cuando Ud. haga un <em>click</em> en <em><b>Grabar</b></em> en la lista, al cerrar este diálogo.</p>  
                       `; 
        } else if (docState == 1) { 
            alertText = `<p><strong>El registro es nuevo</strong></p>  
                         <p>Edite el registro y haga un <em>click</em> en el botón. <br />   
                         Los cambios serán grabados cuando Ud. haga un <em>click</em> en <em><b>Grabar</b></em> en la lista, al cerrar este diálogo.</p>  
                       `; 
        } else if (docState == 3) { 
            alertText = `<p><strong>Registro marcado para ser eliminado</strong></p> 
                         <p>Ud. ha marcado el registro para ser eliminado. <br />    
                         Los cambios serán grabados cuando Ud. haga un <em>click</em> en <em><b>Grabar</b></em> en la lista, al cerrar este diálogo.</p>  
                       `; 
        }

        const conceptoSelectOption = conceptos.map((i) => (<option key={i.id} value={i.id}>{i.descripcion}</option>)); 
        const monedaSelectOption = monedas.map((i) => (<option key={i.moneda} value={i.moneda}>{i.simbolo}</option>)); 
        const rubroSelectOption = tiposProveedor.map((i) => (<option key={i.tipo} value={i.tipo}>{i.descripcion}</option>)); 

        const errorMessageStyle = { fontSize: "small", color: "red" }; 

        const formikSchema = Yup.object().shape({
            concepto: Yup.number('El valor debe ser un número').required('El valor es requerido'),
            cuentaContableID: Yup.number('El valor debe ser un número').required('El valor es requerido'),
        });

        let initialValues = this.props.item; 

        // todos los values deben ir en el objeto; como son selects, pasamos empty string si viene un null, 
        // pues un option en el select no puede tener value null ...   
        initialValues.rubro = this.props.item.rubro ? this.props.item.rubro : ""; 
        initialValues.compania = this.props.item.compania ? this.props.item.compania : ""; 
        initialValues.moneda = this.props.item.moneda ? this.props.item.moneda : ""; 
        initialValues.concepto = this.props.item.concepto ? this.props.item.concepto : ""; 
        initialValues.concepto2 = this.props.item.concepto2 ? this.props.item.concepto2 : ""; 
        initialValues.cuentaContableID = this.props.item.cuentaContableID ? this.props.item.cuentaContableID : ""; 

        return (
            <Grid fluid={true}>
                <Row>
                    <Col sm={12}>
                        {this.state.showAlert &&
                            (
                                <Alert bsStyle={alertType} onDismiss={this.handleAlertDismiss}>
                                    <div dangerouslySetInnerHTML={{ __html: alertText }} />
                                </Alert>
                            )
                        }
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <div>
                            <h4 style={{ marginBottom: 0 }}>Cuentas contables - Definición</h4>
                            <hr style={{ border: '1px solid lightgray', marginTop: 0 }}/>

                            <Formik
                                initialValues={initialValues}
                                validationSchema={formikSchema}
                                onSubmit={(values, { setSubmitting }) => {

                                    // select siempre regresa strings; convertimos a number 
                                    // si viene un '' pasamos null 
                                    values.rubro = values.rubro ? parseInt(values.rubro) : null; 
                                    values.compania = values.compania ? parseInt(values.compania) : null; 
                                    values.moneda = values.moneda ? parseInt(values.moneda) : null;
                                    values.concepto = values.concepto ? parseInt(values.concepto) : null;
                                    values.cuentaContableID = values.cuentaContableID ? parseInt(values.cuentaContableID) : null;
                                
                                    setSubmitting(false);

                                    this.props.functionOk(values); 
                                }}
                            >
                                {({
                                    values,
                                    errors,
                                    touched,
                                    handleChange,
                                    handleBlur,
                                    handleSubmit,
                                    isSubmitting,
                                    setFieldTouched, 
                                    setFieldValue
                                    /* and other goodies */
                                }) => (
                                        <form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col sm={4}>
                                                    <FormGroup bsSize="small">
                                                        <ControlLabel>Rubro: </ControlLabel>

                                                        <FormControl
                                                            componentClass="select" 
                                                            name="rubro"
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.rubro}>
                                                                <option key={0} value={""}>{""}</option>
                                                                {rubroSelectOption}
                                                        </FormControl>

                                                        {errors.rubro && touched.rubro && 
                                                         <div style={errorMessageStyle}>{errors.rubro}</div>}

                                                    </FormGroup>
                                                </Col>

                                                <Col sm={4}>
                                                    <FormGroup bsSize="small">
                                                        <ControlLabel>Compañía: </ControlLabel>
                                                        <AsyncTypeahead
                                                            id={"compania_typeAhead"}
                                                            {...this.state.proveedoresTypeAheadOptions}

                                                            // nos aseguramos que este valor sea siempre un string; por ejemplo, no un null ... 
                                                            defaultInputValue={this.props.item.nombreCompania ? this.props.item.nombreCompania : ""}

                                                            // fires when user selects an item from the list 
                                                            onChange={(selected) => {
                                                                // en selected viene el item seleccionado por el usuario; 
                                                                // casi siempre es un objeto 
                                                                // como la selección puede ser multiple, selected es un array 

                                                                const value = (selected && Array.isArray(selected) && selected.length > 0) ? selected[0].proveedor : "";
                                                                const nombre = (selected && Array.isArray(selected) && selected.length > 0) ? selected[0].nombre : "";

                                                                console.log("onChange / proveedor / selected / value / nombre: ", selected, value, nombre); 

                                                                setFieldValue('compania', value);
                                                                setFieldTouched('compania', true); 

                                                                setFieldValue('nombreCompania', nombre);
                                                                setFieldTouched('nombreCompania', true); 
                                                            }}

                                                            onBlur={(e) => { 
                                                                // si el usuario cambia por "" (deselecciona), actualizamos el valor apropiado
                                                                // (pues no se produce un onChange del TypeAhead) 
                                                                const value = e.target.value; 

                                                                if (!value) { 
                                                                    setFieldValue('compania', "");
                                                                    setFieldTouched('compania', true); 

                                                                    setFieldValue('nombreCompania', "");
                                                                    setFieldTouched('nombreCompania', true); 
                                                                }
                                                            }}

                                                            onSearch={this.handleProveedoresTypeAheadSearch}

                                                            labelKey="nombre" />

                                                        {errors.compania && touched.compania && 
                                                         <div style={errorMessageStyle}>{errors.compania}</div>}
                                                        
                                                    </FormGroup>
                                                </Col>

                                                <Col sm={4}>
                                                    <FormGroup bsSize="small">
                                                        <ControlLabel>Moneda: </ControlLabel>
                                                        <FormControl
                                                            componentClass="select" 
                                                            name="moneda"
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.moneda}>
                                                                <option key={0} value={""}>{""}</option>
                                                                {monedaSelectOption}
                                                        </FormControl>

                                                        {errors.moneda && touched.moneda && 
                                                         <div style={errorMessageStyle}>{errors.moneda}</div>}
                                                        
                                                    </FormGroup>
                                                </Col>

                                            </Row>
                                            <Row>

                                                <Col sm={4}>
                                                    <FormGroup bsSize="small">
                                                        <ControlLabel>Concepto: </ControlLabel>
                                                        <FormControl
                                                            componentClass="select" 
                                                            name="concepto"
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.concepto}>
                                                                <option key={0} value={""}>{""}</option>
                                                                {conceptoSelectOption}
                                                        </FormControl>

                                                        {errors.concepto && touched.concepto && 
                                                         <div style={errorMessageStyle}>{errors.concepto}</div>}
                                                        
                                                    </FormGroup>
                                                </Col>

                                                <Col sm={4}>
                                                    <FormGroup bsSize="small">
                                                        <ControlLabel>Concepto (2): </ControlLabel>
                                                        <FormControl
                                                            type="number"
                                                            name="concepto2"
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.concepto2}
                                                        />

                                                        {errors.concepto2 && touched.concepto2 && 
                                                         <div style={errorMessageStyle}>{errors.concepto2}</div>}
                                                        
                                                    </FormGroup>
                                                </Col>

                                                <Col sm={4}>
                                                    <FormGroup bsSize="small">
                                                        <ControlLabel>Cuenta contable: </ControlLabel>
                                                        <AsyncTypeahead
                                                            id={"cuentaContable_typeAhead"}
                                                            {...this.state.cuentasTypeAheadOptions}

                                                            // nos aseguramos que este valor sea siempre un string; por ejemplo, no un null ... 
                                                            defaultInputValue={this.props.item.descripcionCuentaContable ? this.props.item.descripcionCuentaContable : ''}

                                                            // fires when user selects an item from the list 
                                                            onChange={(selected) => {
                                                                // en selected viene el item seleccionado por el usuario; 
                                                                // casi siempre es un objeto 
                                                                // como la selección puede ser multiple, selected es un array 

                                                                const value = (selected && selected.length > 0) ? selected[0].id : 0;
                                                                const descripcion = (selected && selected.length > 0) ? selected[0].descripcion : "";

                                                                setFieldValue('cuentaContableID', value);
                                                                setFieldTouched('cuentaContableID', true); 

                                                                setFieldValue('descripcionCuentaContable', descripcion);
                                                                setFieldTouched('descripcionCuentaContable', true); 
                                                            }}

                                                            onSearch={this.handleCuentasTypeAheadSearch}
                                                            labelKey="descripcion" />

                                                        {errors.cuentaContableID && touched.cuentaContableID && 
                                                         <div style={errorMessageStyle}>{errors.cuentaContableID}</div>}
                                                        
                                                    </FormGroup>
                                                </Col>

                                            </Row>

                                            <Row>
                                                <Col sm={12}>
                                                    <hr style={{ border: '1px solid lightgray' }}/>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col sm={3} smOffset={9}>
                                                    <Button bsStyle="primary" bsSize="small" type="submit" disabled={isSubmitting}>
                                                        Cerrar (mantener cambios)
                                                    </Button>
                                                </Col>
                                            </Row>

                                        </form>
                                    )}
                            </Formik>
                        </div>

                    </Col>
                </Row>
            </Grid>
        );
    }
}

DefinicionCuentasContables.propTypes = {
    item: PropTypes.object.isRequired, 
    ciaContabSeleccionada: PropTypes.object.isRequired, 
    functionOk: PropTypes.func.isRequired
}


const leerProveedoresFromServer = (search) => { 
    return new Promise((resolve, reject) => { 

        Meteor.call('bancos.proveedores.searchDesdeSql', search, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result.error) { 
                reject(result); 
            }
    
            resolve(result.proveedores)
        })
    })
}


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
