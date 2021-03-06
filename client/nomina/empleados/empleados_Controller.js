

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").
    controller("Nomina_Empleados_Controller", ['$scope', function ($scope) {
        // ------------------------------------------------------------------------------------------------
        // leemos la compañía seleccionada
        let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        let companiaSeleccionadaDoc = {};

        if (companiaSeleccionada) { 
            companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });
        }
            
        $scope.companiaSeleccionada = {};

        if (companiaSeleccionadaDoc) {
            $scope.companiaSeleccionada = companiaSeleccionadaDoc;
        } else {
            $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
        }
    }])
