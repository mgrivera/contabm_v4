

import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('ChequeImpresoModalController',
['$scope', '$modalInstance', 'ciaSeleccionada', 'movimientoBancarioID',
function ($scope, $modalInstance, ciaSeleccionada, movimientoBancarioID) {

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
    }

    $scope.obtenerChequeImpreso = (file) => {
        $scope.showProgress = true;

        // ----------------------------------------------------------------------------------------------
        // actualizamos los datos de configuracion en el collection
        let configuracionChequeImpreso = ConfiguracionChequeImpreso.findOne({ cia: ciaSeleccionada._id });
        if (configuracionChequeImpreso) {
            ConfiguracionChequeImpreso.remove({ _id: configuracionChequeImpreso._id });
        }

        if ($scope.configuracionChequeImpreso) {
            ConfiguracionChequeImpreso.insert({
                _id: new Mongo.ObjectID()._str,
                elaboradoPor: $scope.configuracionChequeImpreso.elaboradoPor ? $scope.configuracionChequeImpreso.elaboradoPor : null,
                revisadoPor: $scope.configuracionChequeImpreso.revisadoPor ? $scope.configuracionChequeImpreso.revisadoPor : null,
                aprobadoPor: $scope.configuracionChequeImpreso.aprobadoPor ? $scope.configuracionChequeImpreso.aprobadoPor : null,
                contabilizadoPor: $scope.configuracionChequeImpreso.contabilizadoPor ? $scope.configuracionChequeImpreso.contabilizadoPor : null,
                cia: ciaSeleccionada._id,
            })
        }

        // ----------------------------------------------------------------------------------------------
        Meteor.call('bancos.obtenerChequeImpreso', "/bancos/movimientosBancarios", file.name, movimientoBancarioID, (err, result) => {

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
                    msg: result.message
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

    $scope.showProgress = true;

    Promise.all([ suscribirBancosChequesConfiguracion(ciaSeleccionada._id),  
                  obtenerPlantillasDesdeDropbox("/bancos/movimientosBancarios") ])
        .then( result => { 
            // en realidad no recibimos ningún result de ninguna de las promises ... 

            $scope.helpers({
                configuracionChequeImpreso: () => {
                    return ConfiguracionChequeImpreso.findOne({ cia: ciaSeleccionada._id });
                },
            });

            const result1 = result[1]; 
        
            $scope.template_files = result1 && result1.files && Array.isArray(result1.files) ? result1.files : 
                                    [ { name: "indefinido", type: "indefinido"} ]; 

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result1.message,
            });

            $scope.showProgress = false;
            $scope.$apply();

        })
        .catch( err => { 

            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: errorMessage });

            $scope.showProgress = false;
            $scope.$apply();
        })
}
])

const suscribirBancosChequesConfiguracion = function(ciaSeleccionadaID) { 
    return new Promise((resolve, reject) => { 
        Meteor.subscribe('configuracionChequeImpreso', ciaSeleccionadaID, { 
            onStop: (err) => {
                if (err) { 
                    reject(err); 
                } else { 
                    resolve(); 
                }
            }, 
            onReady: () => {
                resolve();  
            }, 
        })
    })
}

const obtenerPlantillasDesdeDropbox = function (dir) { 
    return new Promise((resolve, reject) => {
        // ejecutamos un método que lee y regresa desde dropbox las plantillas para notas de cobertura 
        Meteor.call('plantillas.obtenerListaArchivosDesdeDirectorio', dir, (err, result) => {
            if (err) {
                reject(err); 
            }
            if (result.error) { 
                reject(new Error(result.message)); 
            }
            resolve(result); 
        })

    })
}
