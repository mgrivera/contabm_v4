

import * as angular from 'angular';
import * as lodash from 'lodash'; 

import { Meteor } from 'meteor/meteor';

import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Companias } from '/imports/collections/companias';
import { TiposAsientoContable } from '/imports/collections/contab/tiposAsientoContable'; 

import { CajaChica_Parametros_SimpleSchema } from '/imports/collections/bancos/cajaChica.cajasChicas'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar';

import { DialogModal } from '/client/imports/general/genericUIBootstrapModal/angularGenericModal'; 
import { CuentasContablesClient } from '/client/imports/clientCollections/cuentasContables'; 

angular.module("contabm.contab.catalogos").controller("Catalogos_Bancos_CajaChica_Parametros_Controller",
['$scope', '$modal', function ($scope, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let ciaContab = {};

    if (companiaSeleccionada) { 
        ciaContab = Companias.findOne(companiaSeleccionada.companiaID);
    }
        
    $scope.companiaSeleccionada = {};
    let numeroCiaContabSeleccionada = -9999;

    if (ciaContab) {
        $scope.companiaSeleccionada = ciaContab;
        numeroCiaContabSeleccionada = ciaContab.numero;
    }
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    $scope.setIsEdited = function (value) {
        if (!$scope.cajaChica_parametros.docState) { 
            $scope.cajaChica_parametros.docState = 2;
        }

        return;
    }


    $scope.refresh0 = function () {
        if ($scope.cajaChica_parametros && $scope.cajaChica_parametros.docState && $scope.cajaChica_parametros.docState === 1) { 
            DialogModal($modal, "<em>Bancos - Caja chica - Parámetros</em>",
                                `Ud. está ahora agregando un registro nuevo, no hay nada que refrescar.
                                `,
                                false); 
            return; 
        }

        if ($scope.cajaChica_parametros && $scope.cajaChica_parametros.docState) {
            DialogModal($modal, "<em>Bancos - Caja chica - Parámetros</em>",
                                `Aparentemente, Ud. ha efectuado cambios; aún así,
                                desea <em>refrescar el registro</em> y perder los cambios?`,
                                true).then(
                function (resolve) {
                    refresh();
                },
                function (err) {
                    return true;
                })

            return;
        }
        else { 
            refresh();
        }
    }

    let refresh = () => {
        $scope.cajaChica_parametros = { 
            id: 0, 
            tipoAsiento: "", 
            cuentaContablePuenteID: 0, 
            cia: 0, 
        }

        $scope.showProgress = true;
        leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
            (result) => { 
                $scope.cajaChica_parametros = JSON.parse(result);

                $scope.showProgress = false;
                $scope.$apply();
            }, 
            (err) => { 
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);
        
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
    
                $scope.showProgress = false;
                $scope.$apply();
            }
        )
    }

    $scope.helpers({ 
        tiposAsientoContable: () => { 
            return TiposAsientoContable.find({}, { sort: { descripcion: 1 }}); 
        }
    })

    $scope.grabar = function () {
        $scope.showProgress = true;

        let editedItem = $scope.cajaChica_parametros;

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];


        isValid = CajaChica_Parametros_SimpleSchema.namedContext().validate(editedItem);

        if (!isValid) {
            CajaChica_Parametros_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + CajaChica_Parametros_SimpleSchema.label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
            })
        }

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {

                        if (previous == "")
                            // first value
                            return current;
                        else
                            return previous + "<br />" + current;
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        Meteor.call('bancos.cajaChica.catalogos.parametros.save', editedItem, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
                    (result) => { 
                        $scope.cajaChica_parametros = JSON.parse(result);
                        
                        $scope.showProgress = false;
                        $scope.$apply();
                    }, 
                    (err) => { 
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'danger',
                            msg: errorMessage
                        });
            
                        $scope.showProgress = false;
                        $scope.$apply();
                    }
                )
                return; 
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result
            });

            leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
                (result) => { 
                    $scope.cajaChica_parametros = JSON.parse(result);
            
                    $scope.showProgress = false;
                    $scope.$apply();
                }, 
                (err) => { 
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
            
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
        
                    $scope.showProgress = false;
                    $scope.$apply();
                }
            )
        })
    }

    $scope.cajaChica_parametros = { 
        id: 0, 
        tipoAsiento: "", 
        cuentaContablePuenteID: 0, 
        cia: 0, 
    }

    $scope.showProgress = true;
    leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
        (result) => { 
            $scope.cajaChica_parametros = JSON.parse(result);

            // =================================================================================================================
            // ahora leemos las cuentas contables (desde sql) que el usuario ha usado hasta ahora, en los records que ha grabado, 
            // para que estén disponibles en el select de cuentas contables

            // para que estén desde el inicio, leemos las cuentas contables que el usuario ha registrado antes aqui 
            let listaCuentasContablesIDs = [];


            if ($scope.cajaChica_parametros && $scope.cajaChica_parametros.cuentaContablePuenteID) {
                listaCuentasContablesIDs.push($scope.cajaChica_parametros.cuentaContablePuenteID);
            }

            leerCuentasContablesFromSql(listaCuentasContablesIDs, $scope.companiaSeleccionada.numero)
                .then((result) => {

                    // agregamos las cuentas contables leídas al arrary en el $scope. Además, hacemos el binding del ddl en el ui-grid 
                    const cuentasContablesArray = result.cuentasContables;

                    // 1) agregamos el array de cuentas contables al $scope 
                    $scope.cuentasContablesLista = lodash.sortBy(cuentasContablesArray, [ 'descripcion' ]);;

                    $scope.showProgress = false;
                    $scope.$apply();
                })
                .catch((err) => {

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: "Se han encontrado errores al intentar leer las cuentas contables usadas por esta función:<br /><br />" + err.message
                    });

                    $scope.showProgress = false;
                    $scope.$apply();
                })
        }, 
        (err) => { 
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);
    
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();
        }
    )

    $scope.agregarCuentasContablesLeidasDesdeSql = (cuentasArray) => { 

        // cuando el modal que permite al usuario leer cuentas contables desde el servidor se cierra, 
        // recibimos las cuentas leídas y las agregamos al $scope, para que estén presentes en la lista del
        // ddl de cuentas contables 

        let cuentasContablesAgregadas = 0; 

        if (cuentasArray && Array.isArray(cuentasArray) && cuentasArray.length) { 

            for (const cuenta of cuentasArray) { 

                const existe = $scope.cuentasContablesLista.some(x => x.id == cuenta.id); 

                if (existe) { 
                    continue; 
                }

                // -------------------------------------------------------------------------------------------------
                // agregamos las cuentas contables al client collection (minimongo) de cuentas contables 
                const cuentaClientCollection = CuentasContablesClient.findOne({ id: cuenta.id }); 
                if (!cuentaClientCollection) { 
                    CuentasContablesClient.insert(cuenta); 
                }
                // -------------------------------------------------------------------------------------------------

                $scope.cuentasContablesLista.push(cuenta); 
                cuentasContablesAgregadas++; 
            }
        }

        if (cuentasContablesAgregadas) { 
            // hacemos el binding entre la lista y el ui-grid 
            $scope.cuentasContablesLista = lodash.sortBy($scope.cuentasContablesLista, ['descripcion']);
            $scope.$apply();
        }
    }
}
])


function leerItemsDesdeSqlServer(ciaContabID) { 
    return new Promise((resolve, reject) => { 
        Meteor.call('bancos.cajaChica.catalogos.parametros.LeerDesdeSql', ciaContabID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            resolve(result); 
        })
    })
}

// leemos las cuentas contables que usa la función y las regresamos en un array 
const leerCuentasContablesFromSql = function(listaCuentasContablesIDs, companiaContabSeleccionadaID) { 

    return new Promise((resolve, reject) => { 

        Meteor.call('contab.cuentasContables.readFromSqlServer', listaCuentasContablesIDs, (err, result) => {

            if (err) {
                reject(err); 
                return; 
            }

            if (result.error) {
                reject(result.error); 
                return; 
            }

            const cuentasContables = result.cuentasContables; 

            // 1) agregamos al cache (client only minimongo) cuentas que se recibieron desde el server
            cuentasContables.forEach(x => { 
                const cuenta = CuentasContablesClient.findOne({ id: x.id }); 
                if (!cuenta) { 
                    CuentasContablesClient.insert(x); 
                }
            })
            
            // 2) agregamos a la lista recibida desde el server, cuentas que existen en el cache (client only monimongo)
            // nótese que agregamos *solo* las cuentas para la cia seleccionada; en el cache puden haber de varias cias
            CuentasContablesClient.find({ cia: companiaContabSeleccionadaID }).fetch().forEach(x => { 
                const cuenta = cuentasContables.find(cuenta => cuenta.id == x.id); 
                if (!cuenta) { 
                    cuentasContables.push(x); 
                }
            })

            resolve(result); 
        })
    })
}