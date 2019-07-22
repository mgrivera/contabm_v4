

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").
    controller("Nomina_Vacaciones_Controller", ['$scope', function ($scope) {

        // ------------------------------------------------------------------------------------------------
        // leemos la compañía seleccionada
        let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        let companiaSeleccionadaDoc = {};

        if (companiaSeleccionada)
            companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });

        $scope.companiaSeleccionada = {};

        if (companiaSeleccionadaDoc) {
            $scope.companiaSeleccionada = companiaSeleccionadaDoc;
        }
        else {
            $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
        }

        // ------------------------------------------------------------------------------------------------
        $scope.showProgress = true; 

        Promise.all([leerGruposEmpleados($scope.companiaSeleccionada.numero),
        leerListaEmpleados($scope.companiaSeleccionada.numero)])
            .then((result) => {
                // el resultado es un array; cada item tiene un array con items (año y cant de asientos) 
                $scope.helpers({
                    gruposEmpleados: () => {
                        return result[0].items;
                    },
                    empleados: () => {
                        return result[1].items;
                    },
                })

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
    }
])

const leerGruposEmpleados = (ciaContabSeleccionadaID) => {

    return new Promise((resolve, reject) => {

        Meteor.call('gruposEmpleados_lista_leerDesdeSql', ciaContabSeleccionadaID, (err, result) => {

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
