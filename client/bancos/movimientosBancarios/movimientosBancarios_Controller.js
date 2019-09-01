

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Chequeras } from '/imports/collections/bancos/chequeras'; 

angular.module("contabm").controller("Bancos_MovimientosBancarios_Controller", ['$scope', '$state', function ($scope, $state) {

    // cuando tenemos las chequeras, creamos una lista para mostrarlas en el filtro; más abajo
    // 'editamos' estos registros para que se vean mejor en una lista (select) en el filtro
    chequerasList_clientCollection = new Mongo.Collection(null);

    // leemos la compañía seleccionada
    $scope.helpers({
        companiaSeleccionada: () => {
            let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
            return Companias.findOne(ciaContabSeleccionada ? ciaContabSeleccionada.companiaID : -999,
                { fields: { _id: 1, numero: 1, nombre: 1, nombreCorto: 1 } });
        },
    })

    let chequeras_subscriptionHandle = null;

    // leemos la lista de proveedores, para usar en el ddl al registrar el movimiento bancario
    // nótese que (angular-meteor) el publishing se detiene cuando el $scope se destruye ...
    $scope.showProgress = true;

    // suscribimos a chequeras para que estén en minimongo y disponibles para cualquier
    // 'child state'; siempre vienen solo las chequeras para la compañía Contab seleccionada ...
    chequeras_subscriptionHandle =
        Meteor.subscribe('chequeras', JSON.stringify({ noFilter: true, }), () => {

            let chequera = null;
            let descripcionChequera = null;

            // proveedores también regresa la compañía seleccionada; por eso es seguro que siempre existirá
            // en este momento ...
            let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
            let companiaSeleccionada = Companias.findOne(ciaContabSeleccionada.companiaID, { fields: { numero: 1, } });

            Chequeras.find({ cia: companiaSeleccionada.numero }).forEach((chequera) => {

                if (chequera.generica) {
                    descripcionChequera = `${chequera.abreviaturaBanco}
                                        ${chequera.simboloMoneda}
                                        ${chequera.numeroCuentaBancaria} gen`;
                } else {
                    descripcionChequera = `${chequera.abreviaturaBanco}
                                        ${chequera.simboloMoneda}
                                        ${chequera.numeroCuentaBancaria}
                                        ${chequera.desde.toString()}
                                        ${chequera.hasta.toString()}
                                        `;

                    if (chequera.activa) {
                        descripcionChequera = `${descripcionChequera} ${'act'}`;
                    } else {
                        descripcionChequera = `${descripcionChequera} ${'noAcv'}`;
                    }

                    if (chequera.agotadaFlag) {
                        descripcionChequera = `${descripcionChequera} ${'ago'}`;
                    } else {
                        descripcionChequera = `${descripcionChequera} ${'noAgt'}`;
                    }
                };

                chequerasList_clientCollection.insert({
                    numeroChequera: chequera.numeroChequera,
                    descripcion: descripcionChequera
                })
            })

            $scope.showProgress = false;
            $scope.$apply();
        })

    // nótese como detenemos (stop) los subscriptions cuando el controller termina ...
    $scope.$on("$destroy", function handler() {

        if (chequeras_subscriptionHandle) {
            chequeras_subscriptionHandle.stop();
        }
    })
}])
