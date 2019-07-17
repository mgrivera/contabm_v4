

import lodash from 'lodash'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

import { GruposEmpleados_SimpleSchema } from '/models/nomina/catalogos'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { DialogModal } from '/client/imports/general/genericUIBootstrapModal/angularGenericModal'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").
        controller("Catalogos_Nomina_GruposEmpleados_Controller", ['$scope', '$modal', function ($scope, $modal) {

    $scope.showProgress = true;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionada) {
        $scope.companiaSeleccionada = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });
    }
    // ------------------------------------------------------------------------------------------------

    let grupoEmpleadosSeleccionado = {};
    let gruposEmpleadosGridApi = null;

    $scope.gruposEmpleados_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,

        enableCellEdit: false,
        enableCellEditOnFocus: true,

        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            gruposEmpleadosGridApi = gridApi; 

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                grupoEmpleadosSeleccionado = {};

                if (row.isSelected) {
                    grupoEmpleadosSeleccionado = row.entity;

                    $scope.empleados_ui_grid.data = [];
                    $scope.empleados_ui_grid.data = grupoEmpleadosSeleccionado.empleados;
                }
                else {
                    $scope.empleados_ui_grid.data = [];
                    return;
                }
            })

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                    }
                }        
            })
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row.grupo;
        },
        getRowIdentity: function (row) {
            return row.grupo;
        }
    }

    $scope.gruposEmpleados_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
                 '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'grupo',
            field: 'grupo',
            displayName: '##',
            width: 35,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'nombre',
            field: 'nombre',
            displayName: 'Grupo',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 200,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'grupoNominaFlag',
            field: 'grupoNominaFlag',
            displayName: 'Nómina?',
            width: 75,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'cia',
            field: 'cia',
            displayName: 'Cia contab',
            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            cellFilter: 'companiaAbreviaturaFilter',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteGrupoEmpleados(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]


    $scope.nuevoGrupoEmpleados = function () {

        let pk = -1; 
        if ($scope.gruposEmpleados && $scope.gruposEmpleados.length) { 
            // obtenemos el mayor, aplicamos abs a los negativos, convertimos a negativo y sumamos 1 
            // la idea es asignar un valor único a items nuevos, para que ui-grid los maneje correctamente 
            pk = ((Math.max(...$scope.gruposEmpleados.map(a => Math.abs(a.grupo)))) * -1) -1; 
        }

        let item = {
            // obtenemos el mayor absoluto y lo convertimos a negativo; sumamos 1 
            grupo: pk, 
            grupoNominaFlag: false,  
            cia: $scope.companiaSeleccionada.numero,  
            empleados: [], 
            docState: 1
        };

        $scope.gruposEmpleados.push(item);
    }


    $scope.deleteGrupoEmpleados = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.gruposEmpleados, (x) => { return x.grupo === item.grupo; });
        }
        else if (item.docState && item.docState === 3) {
            // permitimos hacer un 'undelete' de un item que antes se había eliminado en la lista (antes de grabar) ...
            delete item.docState;
        }
        else {
            item.docState = 3;
        }
    }

      
    $scope.empleados_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;

                        // marcamos el registro parent
                        if (!grupoEmpleadosSeleccionado.docState) { 
                            grupoEmpleadosSeleccionado.docState = 2; 
                        }
                    }
                }        
            })

        },
        rowIdentity: function (row) {
            return row.claveUnica;
        },
        getRowIdentity: function (row) {
            return row.claveUnica;
        }
    }

    $scope.empleados_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
                 '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'claveUnica',
            field: 'claveUnica',
            displayName: '##',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'empleado',
            field: 'empleado',
            displayName: 'Empleado',
            width: 200,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.empleados:"empleado":"nombre"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'empleado',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: $scope.empleados,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'suspendidoFlag',
            field: 'suspendidoFlag',
            displayName: 'Susp?',
            width: 70,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteGrupoEmpleados_empleado(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]


    $scope.nuevoEmpleado = function () {

        if (lodash.isEmpty(grupoEmpleadosSeleccionado)) { 
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: `Ud. debe seleccionar un grupo de empleados (en la lista de la izquierda) antes de intentar agregar un empleado.`
            });

            return; 
        }

        let pk = -1; 
        if (grupoEmpleadosSeleccionado.empleados && grupoEmpleadosSeleccionado.empleados.length) { 
            // obtenemos el mayor, aplicamos abs a los negativos, convertimos a negativo y sumamos 1 
            // la idea es asignar un valor único a items nuevos, para que ui-grid los maneje correctamente 
            pk = ((Math.max(...grupoEmpleadosSeleccionado.empleados.map(a => Math.abs(a.claveUnica)))) * -1) -1; 
        }

        let item = {
            claveUnica: pk, 
            grupo: grupoEmpleadosSeleccionado.grupo, 
            suspendidoFlag: false, 
            docState: 1
        }

        grupoEmpleadosSeleccionado.empleados.push(item);

        // marcamos el registro parent
        if (!grupoEmpleadosSeleccionado.docState) { 
            grupoEmpleadosSeleccionado.docState = 2; 
        }
    }

    $scope.deleteGrupoEmpleados_empleado = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove(grupoEmpleadosSeleccionado.empleados, (x) => { return x.claveUnica === item.claveUnica; });
        }
        else if (item.docState && item.docState === 3) {
            // permitimos hacer un 'undelete' de un item que antes se había eliminado en la lista (antes de grabar) ...
            delete item.docState;
        }
        else {
            item.docState = 3;
        }

        // marcamos el registro parent
        if (!grupoEmpleadosSeleccionado.docState) { 
            grupoEmpleadosSeleccionado.docState = 2; 
        }
    }

    Promise.all([leerGruposEmpleados($scope.companiaSeleccionada.numero),
                leerListaEmpleados($scope.companiaSeleccionada.numero)])
        .then(result => {
            // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
            $scope.helpers({
                gruposEmpleados: () => {
                    return result[0].items;
                },
                empleados: () => { 
                    return result[1].items;
                }, 
            })

            $scope.gruposEmpleados_ui_grid.data = $scope.gruposEmpleados;
            $scope.empleados_ui_grid.data = [];

            // establecemos la lista para el ddl en el grid 
            $scope.empleados_ui_grid.columnDefs[2].editDropdownOptionsArray = $scope.empleados; 

            $scope.showProgress = false;
            $scope.$apply();
        })
        .catch((err) => {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();

            return;
        })

    $scope.save = function () {
        $scope.showProgress = true;

        let editedItems = lodash.filter($scope.gruposEmpleados, function (item) { return item.docState; });

        if (!editedItems || !Array.isArray(editedItems) || !editedItems.length) {
            DialogModal($modal, "<em>Grupos de empleados</em>",
                                `Aparentemente, <em>no se han efectuado cambios</em> en el (los) registro. No hay nada que grabar.`,
                                false).then();
            $scope.showProgress = false;

            return;
        }

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = GruposEmpleados_SimpleSchema.namedContext().validate(item);

                if (!isValid) {
                    GruposEmpleados_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + GruposEmpleados_SimpleSchema.label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                    });
                }
            }
        })

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {
                        if (previous == "") {
                            return current;
                        }
                        else { 
                            return previous + "<br />" + current;
                        }
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        // en este caso, cada registro puede tener children; un grupo de empleados puede tener muchos empleados; 
        // dejamos solo los children que el usuario ha efectivamente editado 
        editedItems.forEach((x) => lodash.remove(x.empleados, x => !x.docState )); 

        Meteor.call('nomina.gruposEmpleados.saveToSql', editedItems, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.gruposEmpleados_ui_grid.data = $scope.gruposEmpleados;

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            leerGruposEmpleados($scope.companiaSeleccionada.numero)
                .then(result => {
                    // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
                    $scope.helpers({
                        gruposEmpleados: () => {
                            return result.items;
                        }
                    })

                    $scope.gruposEmpleados_ui_grid.data = $scope.gruposEmpleados;
                    $scope.empleados_ui_grid.data = [];

                    // establecemos la lista para el ddl en el grid 
                    $scope.empleados_ui_grid.columnDefs[2].editDropdownOptionsArray = $scope.empleados;

                    // algún row puede estar seleccionado en el grid 
                    gruposEmpleadosGridApi.selection.clearSelectedRows()
                    grupoEmpleadosSeleccionado = {};

                    $scope.alerts.length = 0;

                    $scope.showProgress = false;
                    $scope.$apply();
                })
                .catch((err) => {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                })
        })
    }
}])

const leerGruposEmpleados = (ciaContabSeleccionadaID) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('nomina.gruposEmpleados.leerDesdeSql', ciaContabSeleccionadaID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result && result.error) { 
                reject(result); 
            }
    
            resolve(result)
        })
    })
}

const leerListaEmpleados = (ciaContabSeleccionadaID) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('empleados_lista_leerDesdeSql', ciaContabSeleccionadaID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result && result.error) { 
                reject(result); 
            }
    
            resolve(result)
        })
    })
}
