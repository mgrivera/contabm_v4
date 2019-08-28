

import angular from 'angular'; 

import AngularComponent from "./angularComponent"; 

export default angular.module("contabm.bancos.catalogos.definicionCuentasContables.editarListaModal", [ AngularComponent.name ])
                      .controller('BancosCuentasContablesDefinicion_EditarModal_Controller',
['$scope', '$modalInstance', 'item', 'ciaSeleccionada', function ($scope, $modalInstance, item, ciaSeleccionada) {

    // item: es el item que el usuario seleccionó en la lista (ui-grid); la idea es pasar este item (registro) al 
    // react component para hacer algo con él allí 

    $scope.alerts = [];

    $scope.cancel = function (index) {
        $modalInstance.dismiss("Cancel");
    }

    $scope.ok = function (item) {
        // recibimos el item que el usuario editó desde el react component; cerramos el modal y pasamo el item 

        // recibimos también el proveedor y cuenta que se pudieron, tal vez no!, haber leído desde el servidor 
        // y regresarlos con el item ... 

        const result = { 
            editedItem: item
        }

        $modalInstance.close(result);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;
    $scope.item = item; 
}])