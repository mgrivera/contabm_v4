

import angular from 'angular'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

import EliminarCompanias from '/client/imports/administracion/utilitarios/eliminarCompaniasContab/eliminarCompaniasController'; 
import AsientosContablesRespaldar from '/client/imports/administracion/utilitarios/asientosContablesRespaldar/asientosContables_respaldar'; 

import './utilitarios.html'; 

// Este controller (angular) se carga con la página primera del programa
export default angular.module("contabm.administracion.utilitarios", [ EliminarCompanias.name, AsientosContablesRespaldar.name ])
                      .controller("AdministracionUtilitarios_Controller", ['$scope', function ($scope) {

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
          companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc)
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.showProgress = false;
}
]);
