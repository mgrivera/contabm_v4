

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm")
  .controller("Bancos_Pagos_Controller", ['$scope', '$state', function ($scope, $state) {

    $scope.miSu_List = [
      { miSu: 1, descripcion: 'Mi', },
      { miSu: 2, descripcion: 'Su', },
    ];

    $scope.showProgress = true;

    // bancosCollectionsFacturacion regresa algunos catálogos necesarios para mostrar la página, como
    // la compañía seleccionada. Cuando esta página 'viene de afuera', no espera por los catálogos que
    // existen en el cliente por el publisher 'automático' que los carga al principio. Por ese motivo,
    // debemos ejecutar este publisher y, solo cuando termina, ejecutar helpers como la compañía
    // seleccionada para que se muestre en la página ...

    let bancosCollectionsFacturacion_subscriptionHandle = null;
    // let proveedores_subscriptionHandle = null;

    bancosCollectionsFacturacion_subscriptionHandle = Meteor.subscribe('bancosCollectionsFacturacion', () => {

      let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      $scope.helpers({
        companiaSeleccionada: () => {
          return Companias.findOne(ciaContabSeleccionada.companiaID, { fields: { numero: 1, nombre: 1, nombreCorto: 1 } });
        },
      });

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
