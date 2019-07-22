

import angular from 'angular';

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

import ComprobanteSeniat from './angularComponent'; 

export default angular.module("contabm.bancos.comprobantesSeniat", [ ComprobanteSeniat.name, ]).
                       controller("Bancos_ComprobantesSeniat_Controller",
['$scope', function ($scope) {

    $scope.showProgress = true; 

    let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    $scope.helpers({
        companiaSeleccionada: () => {
            return Companias.findOne(ciaContabSeleccionada.companiaID, { fields: { numero: 1, nombre: 1, nombreCorto: 1 } });
        },
    });

    $scope.showProgress = false;
}])