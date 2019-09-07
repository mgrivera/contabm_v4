
import moment from 'moment';
import { TimeOffset } from '/globals/globals'; 

import { AsientosContables_sql, dAsientosContables_sql } from '/server/imports/sqlModels/contab/asientosContables'; 

Meteor.methods(
{
    asientoContable_leerByID_desdeSql: function (numeroAutomatico) {

        check(numeroAutomatico, Number);

        let response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findAll({ where: { numeroAutomatico: numeroAutomatico }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!response.result.length) {
            // si el asiento no es encontrado, probablemente es porqué el usuario lo eliminó, pero siempre se ejecuta 
            // este método luego de hacer click en Grabar. 
            return { 
                error: false, 
                message: '', 
                asientoContable: JSON.stringify({}), 
            }
        }

        let asientoContable = response.result[0];

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        asientoContable.fecha = moment(asientoContable.fecha).add(TimeOffset, 'hours').toDate();
        asientoContable.ingreso = moment(asientoContable.ingreso).add(TimeOffset, 'hours').toDate();
        asientoContable.ultAct = moment(asientoContable.ultAct).add(TimeOffset, 'hours').toDate();

        if (asientoContable) {
            // nótese como, al menos hasta ahora, no hemos sido capa<ces de leer en una sola operación, un entity y sus
            // inner enities (ejemplo: asiento y partidas). Por ahora, simplemente, hacemos dos queries ...
            response = null;
            response = Async.runSync(function(done) {
                dAsientosContables_sql.findAndCountAll({ where: { NumeroAutomatico: numeroAutomatico }, raw: true })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            if (response.result.count > 0) {

                asientoContable.partidas = [];

                response.result.rows.forEach((partida) => {
                    asientoContable.partidas.push(partida);
                });
            }
        }

        return { 
            error: false, 
            message: '', 
            asientoContable: JSON.stringify(asientoContable), 
        }
    }
})
