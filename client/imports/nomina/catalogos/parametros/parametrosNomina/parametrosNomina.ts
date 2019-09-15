

import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import { mensajeErrorDesdeMethod_preparar } from '../../../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { parametrosNomina_schema } from '../../../../../../imports/collections/nomina/parametros.nomina.parametrosNomina'; 

import { Companias } from '../../../../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../../../../imports/collections/companiaSeleccionada';
import { Monedas } from '../../../../../../imports/collections/monedas';
import { TiposAsientoContable } from '../../../../../../imports/collections/contab/tiposAsientoContable'; 
import { CuentasContablesClient } from 'client/imports/clientCollections/cuentasContables'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm.nomina.catalogos").controller("catalogos_nomina_parametros_parametrosNomina_Controller",
['$scope', function ($scope) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let ciaSeleccionada: any = null;
    let ciaContabSeleccionada: any = null;

    if (Meteor.userId()) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        if (ciaSeleccionada) {
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
        }
    }

    $scope.helpers({ 
        monedas: () => { 
            return Monedas.find({}, { fields: { moneda: 1, descripcion: 1, }})
        }, 
        tiposAsientoContable: () => {
            return TiposAsientoContable.find();
        },
    })


    $scope.setIsEdited = function (field) {
        if ($scope.parametrosNomina.docState) { 
            return;
        }
            
        $scope.parametrosNomina.docState = 2;
    }


// proveemos una lista particular de cuentas contables para el dropdown en el ui-grid; la idea es mostrar
    // cuenta+descripción+cia, en vez de solo la cuenta contable ...
    $scope.cuentasContablesLista = [];
    
    $scope.sumarizarAsientosContables_list = [
        { id: null, descripcion: " " }, 
        { id: 1, descripcion: "Una sola partida" }, 
        { id: 2, descripcion: "Por departamento" }, 
    ]

    $scope.save = function() { 

        $scope.showProgress = true;
        
        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores: string[] = [];

        if ($scope.parametrosNomina && $scope.parametrosNomina.docState && $scope.parametrosNomina.docState != 3) {
            isValid = parametrosNomina_schema.namedContext().validate($scope.parametrosNomina);

            if (!isValid) {
                parametrosNomina_schema.namedContext().validationErrors().forEach(function (error) {
                    errores.push(`El valor '${error.value}' no es adecuado para el campo <b><em>${parametrosNomina_schema.label(error.name)}</b></em>; error de tipo '${error.type}'.`);
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
        
        Meteor.call('nomina.parametros.parametrosNomina.save', $scope.parametrosNomina, (err, saveMethodResult) => {
            
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

            // luego de grabar, y si no se ha producido un error, leemos nuevamente los registros desde la base de datos 
            Meteor.call('nomina.parametros.parametrosNomina.leerDesdeSqlServer', (err, result) => {

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
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: result.message,
                    });
                
                    $scope.showProgress = false;
                    $scope.$apply(); 
                } else { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: saveMethodResult,          // mostramos el mensaje que regresó el save method y no el que lee sql server ...
                    });
                    
                    $scope.parametrosNomina = {}; 
                    $scope.parametrosNomina = JSON.parse(result.parametrosNomina); 
                    
                    $scope.showProgress = false;
                    $scope.$apply(); 
                }
            })
        })
    }


    $scope.showProgress = true;
    $scope.parametrosNomina = {}; 

    Meteor.call('nomina.parametros.parametrosNomina.leerDesdeSqlServer', (err, result) => { 

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
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: result.message,
            });
        
            $scope.showProgress = false;
            $scope.$apply(); 
        }  

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: result.message,
        });
        
        $scope.parametrosNomina = JSON.parse(result.parametrosNomina); 

        // =================================================================================================================
        // para que estén desde el inicio, leemos las cuentas contables que el usuario ha registrado antes aqui 
        let listaCuentasContablesIDs = [];

        if ($scope.parametrosNomina.cuentaContableNomina) {
            listaCuentasContablesIDs.push($scope.parametrosNomina.cuentaContableNomina as never);
        }

        leerCuentasContablesFromSql(listaCuentasContablesIDs, ciaContabSeleccionada.numero)
            .then((result: any) => {

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
    })

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