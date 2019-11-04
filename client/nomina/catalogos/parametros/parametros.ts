
import * as angular from 'angular';
import * as lodash from 'lodash';

import { Companias } from '../../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../../imports/collections/companiaSeleccionada';

angular.module("contabm.nomina").controller("Catalogos_Nomina_Parametros_Controller", ['$scope', function ($scope) {

    $scope.showProgress = true; 

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionadaUser = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionada = {};

    if (companiaSeleccionadaUser) { 
        companiaSeleccionada = Companias.findOne(companiaSeleccionadaUser.companiaID,
                                                 { fields: { numero: true, nombre: true, nombreCorto: true } });
    }
          
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionada && !lodash.isEmpty(companiaSeleccionada)) { 
        $scope.companiaSeleccionada = companiaSeleccionada;
    } else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }

    $scope.showProgress = false; 
}]);