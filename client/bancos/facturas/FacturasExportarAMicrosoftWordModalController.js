

import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';

import moment from 'moment';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar';

angular.module("contabm").controller('FacturasExportarAMicrosoftWordModalController',
['$scope', '$modalInstance', 'ciaSeleccionada', 'factura', 'facturasFiltro',
function ($scope, $modalInstance, ciaSeleccionada, factura, facturasFiltro) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.downLoadWordDocument = false;
    $scope.selectedFile = {};
    $scope.downLoadLink = "";

    $scope.obtenerDocumentoWord = (file) => {

        if ($scope.tipoPlantillaWord != "facturas" && $scope.tipoPlantillaWord != "retIva" && $scope.tipoPlantillaWord != "retIslr") { 
            $scope.alerts.length = 0;

            const message = `Ud. debe indicar el <em>tipo de plantilla</em> <b>antes</b> de intentar seleccionar una.`; 
            $scope.alerts.push({
                type: 'danger',
                msg:  message
            });

            return;
        }

        $scope.showProgress = true;

        if ($scope.tipoPlantillaWord == "retIva") {
            // construimos y pasamos el período al meteor method
            let periodoRetencion = `${moment(factura.fechaRecepcion).format('MM')} - ${moment(factura.fechaRecepcion).format('YYYY')}`;

            Meteor.call('bancos.facturas.obtenerComprobanteRetencionIva', "/bancos/facturas/", file.name, 
                                                                          facturasFiltro, periodoRetencion, (err, result) => {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
        
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });
        
                    $scope.showProgress = false;
                    $scope.$apply();
        
                    return;
                }
        
                if (result.error) { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg:  result.message
                    });
        
                    $scope.showProgress = false;
                    $scope.$apply();
        
                    return;
                }
    
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message,
                });

                // -----------------------------------------------------------------------------------------
                // Dropbox: authenticamos e intentamos obtener el file y ofrecer una forma de download 
                const dropBoxAccessToken = result.dropBoxAccessToken;
                const dbx = new Dropbox({
                    accessToken: dropBoxAccessToken,
                    fetch: fetch
                });

                dbx.sharingGetSharedLinkFile({ url: result.url })
                    .then(function (data) {
                        let downloadUrl = URL.createObjectURL(data.fileBlob);

                        let downloadButton = document.createElement('a');
                        downloadButton.setAttribute('href', downloadUrl);
                        downloadButton.setAttribute('download', result.fileName);
                        downloadButton.innerText = 'Download: ' + result.fileName;

                        let listItem = document.createElement('li');
                        listItem.appendChild(downloadButton);
                        document.getElementById('results').appendChild(listItem);

                        $scope.showProgress = false;
                        $scope.$apply();
                    })
                    .catch(function (err) {
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                        $scope.alerts.length = 0;
                        $scope.alerts.push({ type: 'danger', msg: errorMessage });

                        $scope.showProgress = false;
                        $scope.$apply();

                        return;
                    });
            })

        } else if ($scope.tipoPlantillaWord == "retIslr") {

            Meteor.call('bancos.facturas.obtenerComprobanteRetencionIslr', "/bancos/facturas/", file.name, facturasFiltro, (err, result) => {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
        
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });
        
                    $scope.showProgress = false;
                    $scope.$apply();
        
                    return;
                }
        
                if (result.error) { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg:  result.message
                    });
        
                    $scope.showProgress = false;
                    $scope.$apply();
        
                    return;
                }
    
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message,
                });

                // -----------------------------------------------------------------------------------------
                // Dropbox: authenticamos e intentamos obtener el file y ofrecer una forma de download 
                const dropBoxAccessToken = result.dropBoxAccessToken; 
                const dbx = new Dropbox({
                    accessToken: dropBoxAccessToken,
                    fetch: fetch
                });

                dbx.sharingGetSharedLinkFile({ url: result.url })
                    .then(function (data) {
                        let downloadUrl = URL.createObjectURL(data.fileBlob);

                        let downloadButton = document.createElement('a');
                        downloadButton.setAttribute('href', downloadUrl);
                        downloadButton.setAttribute('download', result.fileName);
                        downloadButton.innerText = 'Download: ' + result.fileName;

                        let listItem = document.createElement('li');
                        listItem.appendChild(downloadButton);
                        document.getElementById('results').appendChild(listItem);

                        $scope.showProgress = false;
                        $scope.$apply();
                    })
                    .catch(function (err) {
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                        $scope.alerts.length = 0;
                        $scope.alerts.push({ type: 'danger', msg: errorMessage });

                        $scope.showProgress = false;
                        $scope.$apply();

                        return;
                    });
            })

        } else if ($scope.tipoPlantillaWord == "facturas") {

            Meteor.call('bancos.facturas.obtenerFacturaImpresa', "/bancos/facturas/",
                                                                 file.name,
                                                                 facturasFiltro, (err, result) => {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
        
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });
        
                    $scope.showProgress = false;
                    $scope.$apply();
        
                    return;
                }
        
                if (result.error) { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg:  result.message
                    });
        
                    $scope.showProgress = false;
                    $scope.$apply();
        
                    return;
                }
    
                $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message,
            });

            // -----------------------------------------------------------------------------------------
            // Dropbox: authenticamos e intentamos obtener el file y ofrecer una forma de download 
            const dropBoxAccessToken = result.dropBoxAccessToken; 
            const dbx = new Dropbox({
                accessToken: dropBoxAccessToken,
                fetch: fetch
            });

            dbx.sharingGetSharedLinkFile({ url: result.url })
                .then(function (data) {
                    let downloadUrl = URL.createObjectURL(data.fileBlob);

                        let downloadButton = document.createElement('a');
                        downloadButton.setAttribute('href', downloadUrl);
                        downloadButton.setAttribute('download', result.fileName);
                        downloadButton.innerText = 'Download: ' + result.fileName;

                        let listItem = document.createElement('li');
                        listItem.appendChild(downloadButton);
                        document.getElementById('results').appendChild(listItem);

                        $scope.showProgress = false;
                        $scope.$apply();
                })
                .catch(function (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                });
            })
        }
    }

    // leemos las plantillas que corresponden a la impresión de movimientos bancarios (transferencias, depósitos, cheques, ...)
    $scope.showProgress = true;

    // ejecutamos un método que lee y regresa desde dropbox las plantillas para notas de cobertura 
    Meteor.call('plantillas.obtenerListaArchivosDesdeDirectorio', "/bancos/facturas", (err, result) => {

        if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: errorMessage });

            $scope.showProgress = false;
            $scope.$apply();

            return;
        }

        if (result.error) { 
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg:  result.message
            });

            $scope.showProgress = false;
            $scope.$apply();

            return;
        }

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: result.message,
        });

        $scope.template_files = result && result.files && Array.isArray(result.files) ? result.files : [ { name: "indefinido", type: "indefinido"} ]; 

        $scope.showProgress = false;
        $scope.$apply();
    })
}
]);
