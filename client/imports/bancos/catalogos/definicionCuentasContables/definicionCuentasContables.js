

import angular from 'angular';
import numeral from 'numeral';
import lodash from 'lodash'; 

import { Companias } from '/imports/collections/companias';
import { Monedas } from '/imports/collections/monedas.js';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Filtros } from '/imports/collections/general/filtros'; 
import { TiposProveedor } from '/imports/collections/bancos/catalogos'; 

import { CuentasContables_Definicion_Schema } from '/models/bancos/consultas/cuentasContablesDefinicion'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

import '/client/imports/bancos/catalogos/definicionCuentasContables/editarListaModal.html'; 
import EditarListaModal from '/client/imports/bancos/catalogos/definicionCuentasContables/editarListaModal'; 

export default angular.module("contabm.bancos.catalogos.definicionCuentasContables", [ EditarListaModal.name ])
       .controller("Catalogos_Bancos_DefinicionCuentasContables_Controller",
       ['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionadaUser = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionada = {};

    if (companiaSeleccionadaUser)
        companiaSeleccionada = Companias.findOne(companiaSeleccionadaUser.companiaID,
                                                { fields: { numero: true, nombre: true, nombreCorto: true } });

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionada && !lodash.isEmpty(companiaSeleccionada))
        $scope.companiaSeleccionada = companiaSeleccionada;
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    // ------------------------------------------------------------------------------------------------

    $scope.conceptosArray = [
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

    $scope.helpers({
        tiposProveedor: () => {
            return TiposProveedor.find({}, { sort: { descripcion: 1 } });
        },
        monedas: () => {
            return Monedas.find({}, { sort: { descripcion: 1 } });
        },
    })

    let cuentasContables_ui_grid_api = null;
    $scope.itemSeleccionado = {};

    // cuando el usuario hace un click en un item en la lista, se abre el modal para editarlo 
    // pero no queremos que esto ocurra cuando el usuario hace un click para eliminar el registro 
    let itemSeleccionadoParaSerEliminado = false;

    $scope.cuentasContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableFiltering: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            cuentasContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                if (itemSeleccionadoParaSerEliminado) {
                    // cuando el usuario hace un click en 'x' para eliminar el item en la lista, no abrimos el modal para editar
                    itemSeleccionadoParaSerEliminado = false;
                    return;
                }

                $scope.itemSeleccionado = {};
                if (row.isSelected) {
                    $scope.itemSeleccionado = row.entity;

                    $scope.editarLista($scope.itemSeleccionado); 
                }
                else { 
                    return;
                } 
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }
    }

    // para permitir que el usuario deseleccione en los ddl's ... nótese unshift to insert the item at the beggining of array 
    $scope.tiposProveedor.unshift({ tipo: null, descripcion: '', }); 
    $scope.monedas.unshift({ moneda: null, descripcion: '', }); 

    $scope.cuentasContables_ui_grid.columnDefs = [
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
            enableFiltering: false,
            width: 25
        },
        {
            name: 'rubro',
            field: 'rubro',
            displayName: 'Rubro',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            cellFilter: 'mapDropdown:row.grid.appScope.tiposProveedor:"tipo":"descripcion"',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposProveedor,

            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            filterCellFiltered: true,
            type: 'number'
        },
        {
            name: 'nombreCompania',
            field: 'nombreCompania',
            displayName: 'Compañía',
            width: 200,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Moneda',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'moneda',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"moneda":"descripcion"',

            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'number'
        },
        {
            name: 'concepto',
            field: 'concepto',
            displayName: 'Concepto',
            width: 200,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            cellFilter: 'mapDropdown:row.grid.appScope.conceptosArray:"id":"descripcion"',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'id',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.conceptosArray,

            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'number'
        },
        {
            name: 'concepto2',
            field: 'concepto2',
            displayName: 'Concepto (2)',
            width: 120,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',

            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'number'
        },
        {
            name: 'descripcionCuentaContable',
            field: 'descripcionCuentaContable',
            displayName: 'Cuenta contable',
            width: 180,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false,
            width: 25
        },
    ]


    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) { 
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.cuentasContablesDefinicion, (x) => { return x._id === item._id; });
        } 
        else { 
            item.docState = 3;
        }
            
        itemSeleccionadoParaSerEliminado = true;
    }

    $scope.nuevo = function () {
        let item = {
            _id: new Mongo.ObjectID()._str,
            claveUnica: 0,             // este es el pk en sql; tendrá un valor válido cuando insertemos el record en sql
            user: Meteor.userId(),
            docState: 1
        };

        $scope.cuentasContablesDefinicion.push(item);

        $scope.cuentasContables_ui_grid.data = [];
        $scope.cuentasContables_ui_grid.data = $scope.cuentasContablesDefinicion;
    }

    $scope.editarLista = function(item) { 
        $modal.open({
            templateUrl: 'client/imports/bancos/catalogos/definicionCuentasContables/editarListaModal.html',
            controller: 'BancosCuentasContablesDefinicion_EditarModal_Controller',
            size: 'lg',
            resolve: {
                item: () => {
                    return item;
                },
                ciaSeleccionada: function () {
                    return $scope.companiaSeleccionada;
                },
            },
        }).result.then(
            function (result) {

                let { editedItem } = result; 



                // TODO: recibir el item que se pudo haber leído, bueno, los items: cuenta contable y proveedor; 
                // si no existe en las listas aquí, agregar ... 

                // finalmente, recibimos los cambios que el usuario hizo al registro y los pasamos al item original 
                if (!editedItem.docState) { 
                    editedItem.docState = 2; 
                }

                if (editedItem.docState && editedItem.docState != 3) { 
                    $scope.itemSeleccionado = editedItem; 

                    // actualizamos el registro en el array ... nótese que cada item tiene un _id 

                    // 1) obtener el index del item en el array 
                    const idx = $scope.cuentasContablesDefinicion.findIndex(x => x._id === editedItem._id); 

                    // 2) actualizar el item en el array con el item que se ha editado 
                    if (idx != -1) { 
                        $scope.cuentasContablesDefinicion[idx] = editedItem; 
                        $scope.cuentasContables_ui_grid.data = $scope.cuentasContablesDefinicion;
                    }
                }

                return true;
            },
            function (cancel) {
                return true;
            })
    }


    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    // -------------------------------------------------------------------------------------------
    $scope.aplicarFiltro = function () {

        $scope.showProgress = true;

        Meteor.call('bancos_cuentasContablesDefinicion_leerDesdeSql', 
                     JSON.stringify($scope.filtro), $scope.companiaSeleccionada.numero, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            if (result.error) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'bancos.cuentasContablesDefinicion', userId: Meteor.userId() })) { 
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'bancos.cuentasContablesDefinicion', userId: Meteor.userId() })._id,
                                { $set: { filtro: $scope.filtro } },
                                { validate: false });
            }
            else { 
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'bancos.cuentasContablesDefinicion',
                    filtro: $scope.filtro
                });
            }
                
            // ------------------------------------------------------------------------------------------------------
            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            leerPrimerosRegistrosDesdeServidor(50);

            // usamos jquery para hacer un click en el link que collapsa el filtro (bootstrap collapse);
            $("#collapseLink").click();
        });
    }


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'bancos.cuentasContablesDefinicion', userId: Meteor.userId() });

    if (filtroAnterior)
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    // ------------------------------------------------------------------------------------------------------

    $scope.cuentasContablesDefinicion = []
    $scope.cuentasContables_ui_grid.data = [];

    let recordCount = 0;
    let limit = 0;

    function leerPrimerosRegistrosDesdeServidor(cantidadRecs) {
        // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
        limit = cantidadRecs;
        Meteor.call('getCollectionCount', 'Temp_Consulta_Bancos_CuentasContables_Definicion', (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // el método regresa la cantidad de items en el collection (siempre para el usuario)
            recordCount = result;
            $scope.leerRegistrosDesdeServer(limit);
        })
    }


    let subscriptionHandle = null;
    $scope.leerRegistrosDesdeServer = function (limit) {
        // la idea es 'paginar' los registros que se suscriben, de 50 en 50
        // el usuario puede indicar 'mas', para leer 50 más; o todos, para leer todos los registros ...
        $scope.showProgress = true;

        // lamentablemente, tenemos que hacer un stop al subscription cada vez que hacemos una nueva,
        // pues el handle para cada una es diferente; si no vamos deteniendo cada una, las anteriores
        // permanecen pues solo detenemos la última al destruir el stop (cuando el usaurio sale de
        // la página). Los documents de subscriptions anteriores permanecen en minimongo y el reactivity
        // de los subscriptions también ...
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }

        subscriptionHandle =
        Meteor.subscribe('temp.bancos.consulta.cuentasContablesDefinicion.list', limit, () => {
            const meteorUserId = Meteor.userId();

            $scope.helpers({
                cuentasContablesDefinicion: () => {
                    return Temp_Consulta_Bancos_CuentasContables_Definicion.find({ user: meteorUserId },
                                                                                 { sort: { rubro: 1, cuentaContable: 1, }})
                                                                           .fetch();
                },
            })

            $scope.cuentasContables_ui_grid.data = $scope.cuentasContablesDefinicion;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${numeral($scope.cuentasContablesDefinicion.length).format('0,0')} registros
                    (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`
            });

            $scope.showProgress = false;
            $scope.$apply();
        });
    };

    $scope.leerMasRegistros = function () {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

    $scope.leerTodosLosRegistros = function () {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

    $scope.save = function () {
        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        let editedItems = $scope.cuentasContablesDefinicion.filter(item => item.docState);

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        // nótese como validamos contra un mondelo 'temp...', pues los registros no están realmente en mongo,
        // solo se copian cuando el usuario filtra en la página para consultar o editar
        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = CuentasContables_Definicion_Schema.namedContext().validate(item);

                if (!isValid) {
                    CuentasContables_Definicion_Schema.namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + CuentasContables_Definicion_Schema.label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                    });
                }
            }
        });

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {

                        if (previous == "")
                            // first value
                            return current;
                        else
                            return previous + "<br />" + current;
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        Meteor.call('bancos.cuentasContablesDefinicionSave', editedItems, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);
    
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
    
                $scope.showProgress = false;
                $scope.$apply();
    
                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result
            });

            // leemos nuevamente los registros desde el servidor
            $scope.cuentasContables_ui_grid.data = [];
            leerPrimerosRegistrosDesdeServidor(limit);
        })
    }

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'leerCuentasContablesDefinicionDesdeSqlServer' });
    EventDDP.addListener('bancos_leerCuentasContablesDefinicionDesdeSqlServer_reportProgressDesdeSqlServer', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
    // ------------------------------------------------------------------------------------------------------

    // ------------------------------------------------------------------------------------------------
    // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
    // para limpiar los items en minimongo ...
    $scope.$on('$destroy', function() {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        };
    })
}])
