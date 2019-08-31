

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { ParametrosBancos } from '/imports/collections/bancos/parametrosBancos'; 
import { ParametrosGlobalBancos } from '/imports/collections/bancos/parametrosGlobalBancos'; 

angular.module("contabm").controller("Bancos_Facturas_Controller", ['$scope', '$state', function ($scope, $state) {

    $scope.estados = [
        { estado: 1, descripcion: 'Pendiente', },
        { estado: 2, descripcion: 'Parcial', },
        { estado: 3, descripcion: 'Pagada', },
        { estado: 4, descripcion: 'Anulada', },
    ];

    $scope.cxcCxPList = [
        { tipo: 1, descripcion: 'CxP', },
        { tipo: 2, descripcion: 'CxC', },
    ];

    $scope.ncNdList = [
        { tipo: 'NC', descripcion: 'NC', },
        { tipo: 'ND', descripcion: 'ND', },
    ];

    // ui-bootstrap alerts ...
    $scope.alerts = [];
    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.showProgress = true;

    let bancosCollectionsFacturacion_subscriptionHandle = null;

    // hacemos un subscribe a tablas necesarias para este proceso: compañías, compañía seleccionada, 
    // parametros bancos y parámetros global bancos 
    bancosCollectionsFacturacion_subscriptionHandle = Meteor.subscribe('bancosCollectionsFacturacion', () => {

        let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

        $scope.helpers({
            companiaSeleccionada: () => {
                return Companias.findOne(ciaContabSeleccionada.companiaID, { fields: { _id: 1, numero: 1, nombre: 1, nombreCorto: 1 } });
            },
        });

        let parametrosGlobalBancos = ParametrosGlobalBancos.findOne();
        let parametrosBancos = ParametrosBancos.findOne({ cia: $scope.companiaSeleccionada.numero });

        if (!parametrosGlobalBancos) {
            let errorMessage = `Error: no hemos encontrado un registro en la tabla <em>Parámtros Global Bancos</em>.
                                Esta tabla debe tener un registro antes que Ud. intente agregar una factura.
                                También puede ocurrir que Ud. no ha corrido la opción
                                <em>Bancos / Generales / Copiar catálogos</em>. Esta opción inicializa este valor en
                                este PC.
                                `;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });
        }

        if (!parametrosBancos) {
            let errorMessage = `Error: no hemos encontrado un registro en la tabla <em>Parámtros Bancos</em> para
                                la compañía Contab que está seleccionada ahora.
                                Esta tabla debe tener un registro para esta compañía,  antes que Ud. intente agregar
                                una factura.
                                También puede ocurrir que Ud. no ha corrido la opción
                                <em>Bancos / Generales / Copiar catálogos</em>. Esta opción inicializa este valor en
                                este PC.
                                `;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });
        }

        $scope.parametrosGlobalBancos = parametrosGlobalBancos;
        $scope.parametrosBancos = parametrosBancos;

        $scope.showProgress = false;
        $scope.$apply();
    })


    // nótese como detenemos (stop) los subscriptions cuando el controller termina ...
    $scope.$on("$destroy", function handler() {

        if (bancosCollectionsFacturacion_subscriptionHandle) {
            bancosCollectionsFacturacion_subscriptionHandle.stop();
        }
    })
}])
