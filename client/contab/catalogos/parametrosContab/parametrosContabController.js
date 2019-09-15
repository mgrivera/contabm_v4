
import lodash from 'lodash';
import { Monedas } from '/imports/collections/monedas';
import { DialogModal } from '/client/imports/general/genericUIBootstrapModal/angularGenericModal'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { CuentasContablesClient } from '/client/imports/clientCollections/cuentasContables'; 

angular.module("contabm.contab.catalogos").controller("Catalogos_ParametrosContab_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};

    if (companiaSeleccionada) {
        companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID);
    }

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) {
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

    $scope.setIsEdited = function (field) {

        if ($scope.parametrosContab.docState)
            return;

        $scope.parametrosContab.docState = 2;
    }

    // preparamos algunas listas para los dropdowns
    // proveemos una lista particular de cuentas contables para el dropdown en el ui-grid; la idea es mostrar
    // cuenta+descripción+cia, en vez de solo la cuenta contable ...
    $scope.cuentasContablesLista = [];

    $scope.helpers({
        monedas: () => {
            return Monedas.find();
        },
    })


    $scope.eliminar = function () {
        if ($scope.parametrosContab.docState && $scope.parametrosContab.docState === 1) {
            // el registro es nuevo; no se ha grabado a la base de datos; informamos al usuario
            DialogModal($modal, "<em>Contab - Parámetros</em>",
                `El registro es nuevo y Ud. no lo ha grabado a la base de datos.<br />
                                   Ud. puede hacer un <em>click</em> en <em>refresh</em> o <em>regresar</em> para deshacer estos cambios.`,
                false).then();
            return;
        }
        else {
            $scope.parametrosContab.docState = 3;
        }
    }

    $scope.nuevo = function () {
        $scope.parametrosContab = {
            cia: $scope.companiaSeleccionada.numero,
            docState: 1,
        };
    }

    $scope.refresh0 = function () {

        if ($scope.parametrosContab.docState) {
            var promise = DialogModal($modal,
                "<em>Contab - Parámetros</em>",
                "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>refrescar el registro</em> y perder los cambios?",
                true);

            promise.then(
                function (resolve) {
                    $scope.refresh();
                },
                function (err) {
                    return true;
                });

            return;
        }
        else
            $scope.refresh();
    };

    $scope.refresh = () => {
        inicializarItem(true);
    }

    $scope.grabar = function () {

        if (!$scope.parametrosContab.docState) {
            inicializarItem(false);
            DialogModal($modal, "<em>Contab - Parámetros</em>",
                "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                false).then();
            return;
        }

        $scope.showProgress = true;

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        let editedItem = lodash.cloneDeep($scope.parametrosContab);

        if (editedItem.docState != 3) {
            isValid = ParametrosContab.simpleSchema().namedContext().validate(editedItem);

            if (!isValid) {
                ParametrosContab.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + ParametrosContab.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
                });
            }
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


        Meteor.call('contab.parametrosContab.save', editedItem, (err, result) => {

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

            if (result.error) {
                // el método que intenta grabar los cambis puede regresar un error cuando,
                // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message
                });
                $scope.showProgress = false;
                $scope.$apply();
            } else {
                // el meteor method regresa siempre el _id del item; cuando el usuario elimina, regresa "-999"
                $scope.id = result.id;

                // 'inicializar...' lee el registro recién agregado; false, para que no muestre un mensaje al usuario; lo
                // mostramos desde aquí ...
                inicializarItem(false);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });

                $scope.showProgress = false;
                $scope.$apply();
            }
        })
    }

    $scope.showProgress = true;

    // nótese que esta es una versión simplificada de esta función, pues siempre existirá *un solo* registro para cada compañía Contab
    function inicializarItem(mostrarMensajeAlUsuario) {
        // leemos el registro desde sql server; nótese que el pk del registro es la cia contab a la cual corresponde
        Meteor.call('contab.parametrosContab.leerDesdeSqlServer',
            $scope.companiaSeleccionada.numero, (err, result) => {

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

                if (result.error) {
                    // el método que intenta grabar los cambios puede regresar un error cuando,
                    // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: result.message
                    });
                    $scope.showProgress = false;
                    $scope.$apply();

                    return; 
                } else {

                    $scope.parametrosContab = JSON.parse(result.parametrosContab);

                    // =================================================================================================================
                    // ahora leemos las cuentas contables (desde sql) que el usuario ha usado hasta ahora, en los records que ha grabado, 
                    // para que estén disponibles en el select de cuentas contables

                    // para que estén desde el inicio, leemos las cuentas contables que el usuario ha registrado antes aqui 
                    let listaCuentasContablesIDs = [];

                    if ($scope.parametrosContab && $scope.parametrosContab.activo1) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.activo1);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.activo2) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.activo2);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.pasivo1) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.pasivo1);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.pasivo2) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.pasivo2);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.capital1) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.capital1);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.capital2) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.capital2);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.ingresos1) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.ingresos1);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.ingresos2) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.ingresos2);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.egresos1) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.egresos1);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.egresos2) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.egresos2);
                    }

                    if ($scope.parametrosContab && $scope.parametrosContab.cuentaGyP) {
                        listaCuentasContablesIDs.push($scope.parametrosContab.cuentaGyP);
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

                    if (mostrarMensajeAlUsuario) {
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'info',
                            msg: result.message
                        });
                    }

                    $scope.showProgress = false;
                    $scope.$apply();
                }
            })
    }

    inicializarItem(true);

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
}])

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
