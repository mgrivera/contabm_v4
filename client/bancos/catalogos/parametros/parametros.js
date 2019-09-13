

import lodash from 'lodash'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { ParametrosBancos } from '/imports/collections/bancos/parametrosBancos'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm.bancos.catalogos").controller("Catalogos_ParametrosBancos_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = true;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaSeleccionadaDoc = {};

      if (companiaSeleccionada)
          companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true } });

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc)
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.datosEditados = function() {
          // debugger;
          let infoEditada = (_.some($scope.parametros, x => { return x.docState; }));
          return infoEditada;
      };


      $scope.parametros_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: false,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {
              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                  if (newValue != oldValue)
                      if (!rowEntity.docState)
                          rowEntity.docState = 2;
              });
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      }

      $scope.parametros_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: '',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableColumnMenu: false,
              enableSorting: false,
              width: 25
          },
          {
              name: 'retencionSobreIvaFlag',
              field: 'retencionSobreIvaFlag',
              displayName: 'Ret/Iva',
              width: 70,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'boolean'
          },
          {
              name: 'retencionSobreIvaPorc',
              field: 'retencionSobreIvaPorc',
              displayName: 'Ret/Iva (%)',
              width: 75,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'currencyFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'footerFacturaImpresa_L1',
              field: 'footerFacturaImpresa_L1',
              displayName: 'Pié factura (1)',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'footerFacturaImpresa_L2',
              field: 'footerFacturaImpresa_L2',
              displayName: 'Pié factura (2)',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'footerFacturaImpresa_L3',
              field: 'footerFacturaImpresa_L3',
              displayName: 'Pié factura (3)',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'aplicarITF',
              field: 'aplicarITF',
              displayName: 'Aplica ITF',
              width: 80,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'boolean'
          },
          {
              name: 'cuentaContableITF',
              field: 'cuentaContableITF',
              displayName: 'Cuenta contable ITF',
              width: 220,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'id',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.cuentasContablesLista,
              cellFilter: 'mapDropdown:row.grid.appScope.cuentasContablesLista:"id":"descripcion"',

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'cia',
              field: 'cia',
              displayName: 'Cia contab',
              width: 70,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'companiaAbreviaturaFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
      ];

      $scope.grabar = function () {
          // debugger;
          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          let editedItems = _.cloneDeep(_.filter($scope.parametros, function (item) { return item.docState; }));

          // nótese como validamos cada item antes de intentar guardar en el servidor
          let isValid = false;
          let errores = [];

          editedItems.forEach(function (item) {
              if (item.docState != 3) {
                  isValid = ParametrosBancos.simpleSchema().namedContext().validate(item);

                  if (!isValid) {
                      ParametrosBancos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + ".");
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
          };

          // por algna razón, cuando agregamos un item al scope y luego a mongo, el item en $scope no se 'sincroniza' en forma
          // adecuada; por eso, lo eliminamos. Luego, con reactivity, será mostrado, nuevamente, en el view ...
          _.remove($scope.parametros, (x) => { return x.docState && x.docState === 1; });

          $meteor.call('parametrosBancosSave', editedItems).then(
              function (data) {

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: data
                  });

                  $scope.showProgress = false;
              },
              function (err) {

                  let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
                  if (err.errorType)
                      errorMessage += " (" + err.errorType + ")";

                  errorMessage += "<br />";

                  if (err.message)
                      // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                      errorMessage += err.message + " ";
                  else {
                      if (err.reason)
                          errorMessage += err.reason + " ";

                      if (err.details)
                          errorMessage += "<br />" + err.details;
                  };

                  if (!err.message && !err.reason && !err.details)
                      errorMessage += err.toString();

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'danger',
                      msg: errorMessage
                  });

                  // hubo un error; antes de hacer el save eliminamos en $scope los items nuevos (docState == 1). Los recuperamos ...
                  _.filter(editedItems, (item) => { return item.docState && item.docState === 1; }).forEach((item) => {
                      $scope.parametros.push(item);
                  });

                  $scope.showProgress = false;
              });
      };

      $scope.showProgress = true;

      Meteor.subscribe("parametrosBancos",
      {
            onReady: function() {

                $scope.helpers({
                    parametros: () => {
                      return ParametrosBancos.find({ cia: companiaSeleccionadaDoc.numero });
                    }
                });

                $scope.parametros_ui_grid.data = $scope.parametros;

                // para que estén desde el inicio, leemos las cuentas contables que el usuario ha registrado antes aqui 
                let listaCuentasContablesIDs = [];

                // construimos la lista de cuentas contables. En este caso, no es muy simple, pues debemos leer las cuentas bancarias de la 
                // compañía contab, en agencias, en bancos ... 
                $scope.parametros.forEach((item) => {
                    // primero la buscamos, para no repetirla 
                    // nótese que cada rubro siempre tendrá una cuenta contable, pues es requerida en el registro 
                    const cuenta = listaCuentasContablesIDs.find(x => x === item.cuentaContableITF);

                    if (!cuenta) {
                        listaCuentasContablesIDs.push(item.cuentaContableITF);
                    }
                })

                leerCuentasContablesFromSql(listaCuentasContablesIDs)
                    .then((result) => {

                        // agregamos las cuentas contables leídas al arrary en el $scope. Además, hacemos el binding del ddl en el ui-grid 
                        const cuentasContablesArray = result.cuentasContables;

                        // 1) agregamos el array de cuentas contables al $scope 
                        $scope.cuentasContablesLista = cuentasContablesArray;

                        // 2) hacemos el binding entre la lista y el ui-grid 
                        $scope.parametros_ui_grid.columnDefs[7].editDropdownOptionsArray = $scope.cuentasContablesLista;

                        $scope.showProgress = false;
                        $scope.$apply();
                    })
                    .catch((err) => {

                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'danger',
                            msg: "Se han encontrado errores al intentar leer las cuentas contables usadas por esta función:<br /><br />" + err.message
                        });

                        $scope.showProgress = false;
                        $scope.$apply();
                    })
            }
      })

    $scope.agregarCuentasContablesLeidasDesdeSql = (cuentasArray) => {

        // cuando el modal que permite al usuario leer cuentas contables desde el servidor se cierra, 
        // recibimos las cuentas leídas y las agregamos al $scope, para que estén presentes en la lista del
        // ddl de cuentas contables 

        let cuentasContablesAgregadas = 0;

        if (cuentasArray && Array.isArray(cuentasArray) && cuentasArray.length) {

            for (const cuenta of cuentasArray) {

                const existe = $scope.cuentasContablesLista.some(x => x.id == cuenta.id);

                if (existe) {
                    continue;
                }

                $scope.cuentasContablesLista.push(cuenta);
                cuentasContablesAgregadas++;
            }
        }

        if (cuentasContablesAgregadas) {
            // hacemos el binding entre la lista y el ui-grid 
            $scope.cuentasContablesLista = lodash.sortBy($scope.cuentasContablesLista, ['descripcion']);

            $scope.parametros_ui_grid.columnDefs[7].editDropdownOptionsArray = $scope.cuentasContablesLista;
        }
    }
}])

// leemos las cuentas contables que usa la función y las regresamos en un array 
const leerCuentasContablesFromSql = function(listaCuentasContablesIDs) { 

    return new Promise((resolve, reject) => { 

        Meteor.call('contab.cuentasContables.readFromSqlServer', listaCuentasContablesIDs, (err, result) => {

            if (err) {
                reject(err); 
                return; 
            }

            if (result.error) {
                reject(result.error); 
                return; 
            }

            resolve(result); 
        })
    })
}
