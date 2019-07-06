

import angular from 'angular'; 

angular.module("contabm").controller('ListaPagosAnticipoAplicarModal_Controller',
['$scope', '$modalInstance', 'facturaID', 'pagosAnticipoSeleccionados_array', 'ciaSeleccionada', 
function ($scope, $modalInstance, facturaID, pagosAnticipoSeleccionados_array, ciaSeleccionada) {

    $scope.alerts = [];

    $scope.cancel = function (index) {
        $modalInstance.dismiss("Cancel");
    }

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.companiaSeleccionada = ciaSeleccionada;
    $scope.facturaID = facturaID; 
    $scope.pagosAnticipoSeleccionados_array = pagosAnticipoSeleccionados_array; 
}])