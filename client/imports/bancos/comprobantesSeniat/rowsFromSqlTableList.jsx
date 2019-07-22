

import React from "react";
import '@material-ui/core';
import '@material-ui/icons';
import 'typeface-roboto';
import MUIDataTable from "mui-datatables";
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import CustomToolbarSelect from '/client/imports/genericReactComponents/muiDatatablesToolbarNoDelete'; 

export default class SimpleTable extends React.Component {

    constructor(props) { 
        super(props); 
    }

    flushRowsSelected = () => {
        this.setState({ rowsSelected: null }, () =>
            this.setState({ rowsSelected: undefined })
        );
    }

    setSome = () => {
        this.setState({ some: this.state.some++ });
    }

    shouldComponentUpdate(nextProps, nextState) {
        // la lista debe ser redesplegada *solo* cuando cambien los rows; por ejemplo, cuando el usuario restablece 
        // un lote de asientos que estaban en mongo y no en sql 

        if (!nextProps.rows) { 
            return true; 
        }

        if (this.props.rows.length === nextProps.rows.length) { 
            return false; 
        }

        return true;
    }

    getMuiTheme = () => createMuiTheme({
        overrides: {
            MUIDataTableHeadCell: {
                root: {
                    fontSize: '10px', 
                }
            }, 
            MUIDataTableBodyCell: {
                root: {
                    fontSize: '10px', 
                }
            },
            // para aplicar un style al título de la tabla 
            // TODO: aquí debemos leer el primary color desde el mui theme; solo que no pudimos encontrar la forma, pero 
            // en un futuro así debe ser ... 
            MuiTypography: {
                h6: {
                    fontSize: '14px', 
                    color: '#5381d6', 
                    fontStyle: 'italic', 
                    fontWeight: 'normal', 
                }
            },
            MuiTablePagination: {
                caption: {
                    fontSize: '10px !important', 
                }, 
                select: {
                    fontSize: '10px !important', 
                }
            }, 
        }
    })

    render() {
        const columns = [
            {
                name: 'numeroFactura',
                label: 'Factura',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'numeroControl',
                label: 'Control',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'fechaEmision',
                label: 'F emisión',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'fechaRecepcion',
                label: 'F recepción',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'proveedor',
                label: 'Proveedor',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'ncNd',
                label: 'Nc/Nd',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'montoNoImponible',
                label: 'Imponible',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'montoImponible',
                label: 'No imponible',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'numeroComprobante',
                label: 'Comprobante',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
            {
                name: 'numeroOperacion',
                label: 'Operación',
                options: {
                    filter: false, 
                    sort: false,
                },
            },
        ]; 

        const data = this.props.rows; 
        const setListIndex = this.props.setListIndex; 

        const options = {
            filterType: "textField",
            print: false,
            filter: false, 
            download: false,
            selectableRows: 'single', 
            viewColumns: false,

            onRowsSelect: (currentRowsSelected, allRowsSelected) => {
                // inicializamos el selected index que se recibe como prop desde el tab component 
                let idx = null; 

                if (allRowsSelected && Array.isArray(allRowsSelected) && allRowsSelected.length) { 
                    idx = allRowsSelected[0].index; 
                }

                setListIndex(idx); 
            }, 

            customToolbarSelect: selectedRows => (
                <CustomToolbarSelect
                    selectedRows={selectedRows}
                    flushRowsSelected={this.flushRowsSelected}
                    setSome={this.setSome}
                />
            ), 

            textLabels: {
                body: {
                    noMatch: "Sorry, no se han encontrado registros que mostrar",
                    toolTip: "Sort",
                },
                pagination: {
                    next: "Prox pag",
                    previous: "Pag ant",
                    rowsPerPage: "Cant recs:",
                    displayRows: "de",
                },
                selectedRows: {
                    text: "reg(s) seleccionados",
                    delete: "Eliminar",
                },
            },

            rowsPerPage: 5, 
            rowsPerPageOptions: [5, 10, 15, 20],
            responsive: "scroll"
        };

        return (
            <MuiThemeProvider theme={this.getMuiTheme()}>
                <MUIDataTable
                    title={"Números de comprobante Seniat registrados en las facturas de proveedores"}
                    data={data}
                    columns={columns}
                    options={options}
                />
            </MuiThemeProvider>
        );
    }
}