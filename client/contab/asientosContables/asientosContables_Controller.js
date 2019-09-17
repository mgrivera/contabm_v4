

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").controller("Contab_AsientosContables_Controller", ['$scope', '$stateParams', '$state', function ($scope, $stateParams, $state) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }
    
    let companiaSeleccionada = { };
    $scope.companiaSeleccionada = { };

    // ejecutamos un método para leer los centros de costro desde sql server 
    // los centros de costro no existen en mongo; los leemos directamente desde sql server y los agregamos a un array en $scope para que estén 
    // disponiles para todos los children de este state ... 
    $scope.showProgress = true;
    $scope.centrosCosto = [];

    Meteor.subscribe('catalogosContab', () => {
        // Ok, los catálogos necesarios están en el client

        // leemos la compañía seleccionada
        companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

        if (companiaSeleccionada) { 
            $scope.companiaSeleccionada = Companias.findOne(companiaSeleccionada.companiaID, 
                { fields: { numero: true, nombre: true, nombreCorto: true } });

            if (!$scope.companiaSeleccionada) { 
                $scope.companiaSeleccionada = { nombre: "No hay una compañía seleccionada ..." };
            }
        }

        Meteor.call('contab.leerCentrosCostro.desdeSqlServer',(err, result) => {

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

            $scope.centrosCosto = JSON.parse(result); 
    
            // agregamos un evento para que el child controller sepa que ahora tenemos los centros de costo en el parent controller 
            // los centros de costo son mostrados en la lista de partidas en un ddl; deben existir para que la lista pueda ser mostrada 
            $scope.$broadcast('actualizarCatalogos', { "val": null }); 
    
            $scope.showProgress = false;
    
            // para que el child controller (asientoContable) ejecute el watch sobre este array y muestre los centros de costo en el ddl en el ui-grid
            $scope.$digest();           // (según angular docs) Processes all of the watchers of the current scope and its children.      
            $scope.$apply();
        })
    })
}])
