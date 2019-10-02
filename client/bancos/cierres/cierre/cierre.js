

import lodash from 'lodash'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Bancos_Cierre_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'cierreBancos' });
    EventDDP.addListener('bancos_cierreBancos_reportProgress', function (process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};

    if (companiaSeleccionada)
        companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true } });

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc)
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    // ------------------------------------------------------------------------------------------------

    $scope.showProgress = true;
    $scope.ultimoMesCerrado = {};
    $scope.mesesArray = [];

    Meteor.call('bancosLeerUltimoMesCerrado', companiaSeleccionadaDoc, function (err, result) {

        if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: errorMessage });

            $scope.showProgress = false;
            $scope.$apply();

            return;
        }

        $scope.ultimoMesCerrado = JSON.parse(result);
        $scope.mes2 = nombreMes($scope.ultimoMesCerrado.mes);

        // determinamos los meses que faltan, desde el último mes cerrado, hasta diciembre (más anual)
        // y mostramos al usuario en una lista, para que indique hasta donde desea cerrar ...

        // si el último mes cerrado es Diciembre, agregamos solo 'Traspaso de saldos al año: 9999'
        if (parseInt($scope.ultimoMesCerrado.mes) == 12) { 
            $scope.mesesArray.push({ mes: 13, nombre: 'Traspaso de saldos al año ' + (parseInt($scope.ultimoMesCerrado.ano) + 1) });
        } else { 
            $scope.mesesArray = determinarMesesHastaDiciembre($scope.ultimoMesCerrado.mes);
        }
            
        $scope.showProgress = false;
        $scope.$apply();
    })


    $scope.parametros = {};

    $scope.cerrar = () => {

        if (!$scope.parametros.mesACerrar || !Array.isArray($scope.parametros.mesACerrar) || lodash.isEmpty($scope.parametros.mesACerrar)) {

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: `Ud. debe seleccionar en la lista el mes que quiere cerrar.`
            });

            return;
        }

        if ($scope.parametros.mesACerrar.length > 1) {

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: `Seleccione un solo mes en la lista.<br />
                      Si desea cerrar más de un mes, debe seleccionar <b>solo</b> el último en la lista.`
            });

            return;
        }

        $scope.showProgress = true;

        // si el usuario va a cerrar meses, ejecutamos el cierre mensual
        // si va a ejecutar el cierre para un mes 13, ejecutamos el traspaso de saldos

        if ($scope.parametros.mesACerrar[0] < 13) {
            let mesesArray = [];

            for (let i = $scope.ultimoMesCerrado.mes + 1; i <= $scope.parametros.mesACerrar[0]; i++) {
                mesesArray.push(i);
            }

            // para medir y mostrar el progreso de la tarea ...
            $scope.processProgress.current = 0;
            $scope.processProgress.max = 0;
            $scope.processProgress.progress = 0;

            Meteor.call('bancosCierre', mesesArray, $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc, (err, result1) => {

                    if (err) {
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                        $scope.alerts.length = 0;
                        $scope.alerts.push({ type: 'danger', msg: errorMessage });

                        $scope.showProgress = false;
                        $scope.$apply();

                        return;
                    }

                    // tal y como hicimos al abrir  la página, leemos el umc y reconstruímos la lista de meses
                    $scope.ultimoMesCerrado = {};

                    Meteor.call('bancosLeerUltimoMesCerrado', companiaSeleccionadaDoc, (err, result2) => {

                        if (err) {
                            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                            $scope.alerts.length = 0;
                            $scope.alerts.push({ type: 'danger', msg: errorMessage });

                            $scope.showProgress = false;
                            $scope.$apply();

                            return;
                        }

                        $scope.ultimoMesCerrado = JSON.parse(result2);
                        $scope.mes2 = nombreMes($scope.ultimoMesCerrado.mes);

                        // determinamos los meses que faltan, desde el último mes cerrado, hasta diciembre (más anual)
                        // y mostramos al usuario en una lista, para que indique hasta donde desea cerrar ...
                        $scope.mesesArray = [];
                        if (parseInt($scope.ultimoMesCerrado.mes) == 12) { 
                            $scope.mesesArray.push({ mes: 13, nombre: 'Traspaso de saldos al año ' + (parseInt($scope.ultimoMesCerrado.ano) + 1) });
                        } else { 
                            $scope.mesesArray = determinarMesesHastaDiciembre($scope.ultimoMesCerrado.mes);
                        }
                            
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'info',
                            msg: result1
                        });

                        $scope.showProgress = false;
                        $scope.$apply();
                    })
                })
        }
        else {
            // para medir y mostrar el progreso de la tarea ...
            $scope.processProgress.current = 0;
            $scope.processProgress.max = 0;
            $scope.processProgress.progress = 0;

            Meteor.call('bancosCierre_traspasoSaldos', $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc, (err, result) => {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                // tal y como hicimos al abrir  la página, leemos el umc y reconstruímos la lista de meses
                $scope.ultimoMesCerrado = {};

                // tal y como hicimos al abrir  la página, leemos el umc y reconstruímos la lista de meses
                $scope.ultimoMesCerrado = {};

                Meteor.call('bancosLeerUltimoMesCerrado', companiaSeleccionadaDoc, (err, result2) => {

                    if (err) {
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                        $scope.alerts.length = 0;
                        $scope.alerts.push({ type: 'danger', msg: errorMessage });

                        $scope.showProgress = false;
                        $scope.$apply();

                        return;
                    }

                    $scope.ultimoMesCerrado = JSON.parse(result2);
                    $scope.mes2 = nombreMes($scope.ultimoMesCerrado.mes);

                    // determinamos los meses que faltan, desde el último mes cerrado, hasta diciembre (más anual)
                    // y mostramos al usuario en una lista, para que indique hasta donde desea cerrar ...
                    $scope.mesesArray = [];
                    if (parseInt($scope.ultimoMesCerrado.mes) == 12) { 
                        $scope.mesesArray.push({ mes: 13, nombre: 'Traspaso de saldos al año ' + (parseInt($scope.ultimoMesCerrado.ano) + 1) });
                    } else { 
                        $scope.mesesArray = determinarMesesHastaDiciembre($scope.ultimoMesCerrado.mes);
                    }

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: result
                    });

                    $scope.showProgress = false;
                    $scope.$apply();
                })
            })
        }
    }

}])

function nombreMes(mes) {

    switch (mes) {
        case 0:
            return 'Ninguno';
        case 1:
            return 'Enero';
        case 2:
            return 'Febrero';
        case 3:
            return 'Marzo';
        case 4:
            return 'Abril';
        case 5:
            return 'Mayo';
        case 6:
            return 'Junio';
        case 7:
            return 'Julio';
        case 8:
            return 'Agosto';
        case 9:
            return 'Septiembre';
        case 10:
            return 'Octubre';
        case 11:
            return 'Noviembre';
        case 12:
            return 'Diciembre';
        case 13:
            return 'Anual';
        default:
            return "Indefinido (?)";
    }
}


function determinarMesesHastaDiciembre(mes) {

    // esta función determina los meses que faltan, desde el mes que se pasa, hasta diciembre ...

    let mesesArray = [];

    for (let i = mes + 1; i <= 12; i++) {
        mesesArray.push({ mes: i, nombre: nombreMes(i) });
    }

    return mesesArray;
}
