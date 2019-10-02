

import moment from 'moment';
import lodash from 'lodash';
import { TimeOffset } from '/globals/globals'; 

import { AsientosContables_sql, dAsientosContables_sql } from '/server/imports/sqlModels/contab/asientosContables'; 

Meteor.methods(
{
    asientosContablesSave: function (asientoContable, fechaOriginalAsientoContable) {

        if (!asientoContable || !asientoContable.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        const usuario = Meteor.users.findOne(Meteor.userId());

        // desde el cliente, viene la fecha original del asiento, cuando el asiento no era nuevo y fue editado. La idea
        // es poder validar que: 1) un asiento no cambie su fecha a un mes diferente; 2) el mes al cual corresponde
        // originalmente el asiento no esté cerrado ...
        if (fechaOriginalAsientoContable && lodash.isDate(fechaOriginalAsientoContable)) {
            if (fechaOriginalAsientoContable.getFullYear() != asientoContable.fecha.getFullYear())
                throw new Meteor.Error("meses-diferentes",
                    "La fecha de un asiento contable no puede ser cambiada a una que corresponda a un mes diferente.");

            if (fechaOriginalAsientoContable.getMonth() != asientoContable.fecha.getMonth())
                throw new Meteor.Error("meses-diferentes",
                    "La fecha de un asiento contable no puede ser cambiada a una que corresponda a un mes diferente.");

            const validarMesCerradoEnContab =
                ContabFunctions.validarMesCerradoEnContab(fechaOriginalAsientoContable,
                                                          asientoContable.cia,
                                                          asientoContable.asientoTipoCierreAnualFlag ?
                                                          asientoContable.asientoTipoCierreAnualFlag :
                                                          false);

            if (validarMesCerradoEnContab.error)
                throw new Meteor.Error("meses-cerrado-en-Contab", validarMesCerradoEnContab.errMessage);
        }

        const validarMesCerradoEnContab = ContabFunctions.validarMesCerradoEnContab(asientoContable.fecha,
                                                                                  asientoContable.cia,
                                                                                  asientoContable.asientoTipoCierreAnualFlag ?
                                                                                  asientoContable.asientoTipoCierreAnualFlag :
                                                                                  false);

        if (validarMesCerradoEnContab.error)
            throw new Meteor.Error("meses-cerrado-en-Contab", validarMesCerradoEnContab.errMessage);


        if (asientoContable.docState == 1) {
            delete asientoContable.docState;

            // debemos asignar algunos valores antes de agregar el asiento a mongo y a sql server
            asientoContable.mes = asientoContable.fecha.getMonth() + 1;
            asientoContable.ano = asientoContable.fecha.getFullYear();

            asientoContable.ingreso = new Date();
            asientoContable.ultAct = new Date();

            const determinarMesFiscal = ContabFunctions.determinarMesFiscal(asientoContable.fecha, asientoContable.cia);

            if (determinarMesFiscal.error)
                throw new Meteor.Error("error-determinar-mes-fiscal", determinarMesFiscal.errorMessage);

            asientoContable.mesFiscal = determinarMesFiscal.mesFiscal;
            asientoContable.anoFiscal = determinarMesFiscal.anoFiscal;

            const determinarNumeroAsientoContab = ContabFunctions.determinarNumeroAsientoContab(
                  asientoContable.fecha, asientoContable.tipo, asientoContable.cia);

            if (determinarNumeroAsientoContab.error)
                throw new Meteor.Error("error-determinar-numero-Contab", determinarNumeroAsientoContab.errMessage);

            asientoContable.numero = determinarNumeroAsientoContab.numeroAsientoContab;

            asientoContable.convertirFlag = true;
            asientoContable.copiableFlag = true;

            asientoContable.partidas.forEach((partida) => { delete partida.docState; });

            // ----------------------------------------------------------------------------------------------------------------
            // sequelize siempre convierte las fechas a utc; nuestro offset en ccs es -4.30; sequelize va a sumar
            // 4.30 para llevar a utc; restamos 4.30 para eliminar este efecto ...
            let asientoContable_sql = lodash.cloneDeep(asientoContable);

            asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'hours').toDate();
            asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'hours').toDate();
            asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'hours').toDate();

            delete asientoContable_sql.partidas; 

            response = Async.runSync(function(done) {
                AsientosContables_sql.create(asientoContable_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            const savedItem = response.result.dataValues;

            // ---------------------------------------------------------------------------------------------------
            // finalmente, actualizamos las partidas del asiento contable
            asientoContable.partidas.forEach((partida) => {
                partida.numeroAutomatico = savedItem.numeroAutomatico;

                response = Async.runSync(function(done) {
                    dAsientosContables_sql.create(partida)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            })

            asientoContable.numeroAutomatico = savedItem.numeroAutomatico;
        }


        if (asientoContable.docState == 2) {
            delete asientoContable.docState;

            if (asientoContable.partidas) { 
                // intentamos eliminar alguna partida que el usuario haya decidido eliminar 
                lodash.remove(asientoContable.partidas, (p) => { return p.docState == 3; });
                asientoContable.partidas.forEach((partida) => { delete partida.docState; });
            }
            
            asientoContable.ultAct = new Date();
            asientoContable.usuario = usuario.emails[0].address;

            // -------------------------------------------------------------------------------------------------------------------------
            // ahora actualizamos el asiento contable; nótese como usamos el mismo objeto; sequelize ignora algunos fields que no
            // existan en el modelo ...

            // ----------------------------------------------------------------------------------------------------------------
            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            let asientoContable_sql = lodash.cloneDeep(asientoContable);

            asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'hours').toDate();
            asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'hours').toDate();
            asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'hours').toDate();

            delete asientoContable_sql.partidas; 

            response = Async.runSync(function(done) {
                AsientosContables_sql.update(asientoContable_sql, { where: { numeroAutomatico: asientoContable.numeroAutomatico }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // eliminamos las partidas; luego las registraremos nuevamente ...
            response = Async.runSync(function(done) {
                dAsientosContables_sql.destroy({ where: { numeroAutomatico: asientoContable.numeroAutomatico } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // ---------------------------------------------------------------------------------------------------
            // finalmente, actualizamos las partidas del asiento contable
            if (asientoContable.partidas) { 
                asientoContable.partidas.forEach((partida) => {
                    partida.numeroAutomatico = asientoContable.numeroAutomatico;
    
                    response = Async.runSync(function(done) {
                        dAsientosContables_sql.create(partida)
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });
    
                    if (response.error) { 
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }
                })
            }
        }


        if (asientoContable.docState == 3) {
            // sql elimina (cascade delete) las partidas ...
            response = Async.runSync(function(done) {
                AsientosContables_sql.destroy({ where: { numeroAutomatico: asientoContable.numeroAutomatico } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }

        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: asientoContable.numeroAutomatico.toString(),
        };
    }
});
