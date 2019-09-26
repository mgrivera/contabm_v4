

import lodash from 'lodash';
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { MesesDelAnoFiscal } from '/imports/collections/contab/mesesAnoFiscal'; 
import { Filtros } from '/imports/collections/general/filtros'; 
import { Temp_Consulta_SaldosContables } from '/imports/collections/contab/consultas/tempConsultaSaldosContables';

import { DialogModal } from '/client/imports/general/genericUIBootstrapModal/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm")
       .controller("Contab_Consultas_Saldos_Lista_Controller",
       ['$scope', '$stateParams', '$state', '$modal', 'uiGridConstants', 
        function ($scope, $stateParams, $state, $modal, uiGridConstants) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;
    var pageNumber = $stateParams.pageNumber;

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada)
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID);
    // ------------------------------------------------------------------------------------------------

    $scope.regresarALista = function () {
        $state.go("contab.consulta_saldos.filtro", { origen: $scope.origen });
    };

    $scope.exportarExcel = function() {

        let modalInstance = $modal.open({
            templateUrl: 'client/contab/consultas/saldos/exportarExcelModal.html',
            controller: 'ContabSaldosConsultaExportarExcel_Controller',
            size: 'md',
            resolve: {
                ciaSeleccionada: () => {
                    return companiaContab;
                },
            },
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    };


    let saldosContables_ui_grid_api = null;
    let saldoContableSeleccionado = {};

    $scope.saldosContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: true,
        showGridFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            saldosContables_ui_grid_api = gridApi;

            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!rowEntity.docState)
                        rowEntity.docState = 2;
            })

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                saldoContableSeleccionado = {};

                if (row.isSelected) {
                    saldoContableSeleccionado = row.entity;
                }
                else
                    return;
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

    $scope.helpers({
        mesesDelAnoFiscal: () => {
          return MesesDelAnoFiscal.find({ cia: companiaContab && companiaContab.numero ? companiaContab.numero : -99});
        }
    })


    $scope.saldosContables_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
                '<span ng-show="row.entity[col.field] == 0" class="fa fa-circle-thin" style="color: gray; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            enableFiltering: false,
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'cuentaContable',
            field: 'cuentaContable',
            displayName: 'Cuenta contable',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'nombreCuentaContable',
            field: 'nombreCuentaContable',
            displayName: 'Descripcion',
            width: '150',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'simboloMoneda',
            field: 'simboloMoneda',
            displayName: 'Mon',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'simboloMonedaOriginal',
            field: 'simboloMonedaOriginal',
            displayName: 'Mon orig',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ano',
            field: 'ano',
            displayName: 'Año',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'inicial',
            field: 'inicial',
            displayName: 'Inicial',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes01',
            field: 'mes01',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 1; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes02',
            field: 'mes02',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 2; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes03',
            field: 'mes03',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 3; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes04',
            field: 'mes04',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 4; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes05',
            field: 'mes05',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 5; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes06',
            field: 'mes06',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 6; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes07',
            field: 'mes07',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 7; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes08',
            field: 'mes08',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 8; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes09',
            field: 'mes09',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 9; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes10',
            field: 'mes10',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 10; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes11',
            field: 'mes11',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 11; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'mes12',
            field: 'mes12',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 12; }).nombreMes,
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'anual',
            field: 'anual',
            displayName: 'Anual',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true, 
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
    ]

    // el usuario puede indicar que desea ver más decimales; lo hace en el filtro; por eso lo recuperamos aquí 
    const filtroAnterior = Filtros.findOne({ nombre: 'contab.consulta.saldos', userId: Meteor.userId() });

    if (filtroAnterior && filtroAnterior.filtro && filtroAnterior.filtro.mostrarMasDe2Decimales) {
        for (let column of $scope.saldosContables_ui_grid.columnDefs) { 
            if (column.cellFilter === "currencyFilterAndNull") { 
                column.cellFilter = "currencyFilterAndNull6Decimals"; 
                column.footerCellFilter = "currencyFilterAndNull6Decimals"; 
                column.width = "130"; 
            }
        }
    }


    $scope.grabar = function () {

        const edits = $scope.saldosContables.some(x => x.docState); 

        if (!edits) {
            DialogModal($modal, "<em>Saldos contables - Consulta</em>",
                                `Aparentemente, <em>no se han efectuado cambios</em> en el registro.
                                No hay nada que grabar.`,
                                false).then();
            return;
        }

        if (filtroAnterior && filtroAnterior.filtro && filtroAnterior.filtro.agruparPorMoneda) { 
            DialogModal($modal, "<em>Saldos contables - Consulta</em>",
                                `En las opciones a esta consulta, Ud. indicó que quería <em>agrupar</em> por moneda.<br />
                                 Cuando la consulta es agrupada por moneda, no se pueden editar los saldos iniciales.`,
                                false).then();
            return;
        }

        grabar2();
    }


    function grabar2() {
        $scope.showProgress = true;

        let editedItems = $scope.saldosContables.filter(x => x.docState). 
                                                 map(x => { return { 
                                                     cuentaContableID: x.cuentaContableID, 
                                                     ano: x.ano, 
                                                     moneda: x.moneda, 
                                                     monedaOriginal: x.monedaOriginal, 
                                                     inicial: x.inicial, 
                                                     docState: x.docState, 
                                                 }}); 

        $scope.saldosContables_ui_grid.data = [];

        Meteor.call('contab.saldos.grabar', editedItems, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.saldosContables_ui_grid.data = $scope.saldosContables;

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

            console.log("saldos contables (before): ", $scope.saldosContables); 

            $scope.helpers({ 
                saldosContables: () => { 
                    return Temp_Consulta_SaldosContables.find({ user: Meteor.userId() }, 
                                                              { sort: { cuentaContableID: true }});
                }
            })

            console.log("saldos contables (after): ", $scope.saldosContables); 
            $scope.saldosContables_ui_grid.data = $scope.saldosContables;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
    }


    $scope.saldosContables = []
    $scope.saldosContables_ui_grid.data = [];
    $scope.showProgress = true;

    let subscriptionHandle = null;

    subscribeSaldosContables(subscriptionHandle)
        .then((result) => { 
            subscriptionHandle = result.subscriptionHandle; 

            $scope.helpers({ 
                saldosContables: () => { 
                    return Temp_Consulta_SaldosContables.find({ user: Meteor.userId() }, 
                                                              { sort: { cuentaContableID: true }});
                }
            })

            $scope.saldosContables_ui_grid.data = $scope.saldosContables;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: $scope.saldosContables.length.toString() + " registros han sido seleccionados ..."
            });

            $scope.showProgress = false;
            $scope.$apply();
        })


    $scope.$on("$destroy", () => {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }
    })
}])


function subscribeSaldosContables(subscriptionHandle) { 
    return new Promise((resolve, reject) => { 

        subscriptionHandle =
        Meteor.subscribe('tempConsulta_saldosContables', () => {
            resolve ({ subscriptionHandle: subscriptionHandle }); 
        })
    })
}
