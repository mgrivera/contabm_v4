

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import { AsientosContables_sql } from '/server/imports/sqlModels/contab/asientosContables'; 

import { ensureValueIsDate } from '/server/imports/general/generalFunctions'; 

Meteor.methods(
{
    contab_asignarNumeroAsientoContab: function (numeroAutomatico) {

        // recibimos el pk de un asiento, asignamos un número Contab y actualizamos en mongo y en sql server ...
        check(numeroAutomatico, Number);

        // -----------------------------------------------------------------------
        // finalmente, debemos actualizar el asiento en sql server
        let response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findByPk(numeroAutomatico, { 
                attributes: [ 'fecha', 'tipo', 'cia', ]
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!response.result) { 
            throw new Meteor.Error("Asiento-no-encontrado",
                                   `Error inesperado: el asiento contable, cuyo número automático es
                                   '${numeroAutomatico.toString()}', no pudo ser leído en la base de datos (???)`);
        }
            

        const asientoContable = response.result;

        if (!asientoContable){ 
            throw new Meteor.Error("Asiento-no-encontrado",
                                   `Error inesperado: el asiento contable, cuyo número automático es
                                   '${numeroAutomatico.toString()}', no pudo ser leído en la base de datos (???)`);
        }

        if (asientoContable.numero >= 0)
            throw new Meteor.Error("Asiento-con-numeroAsignado",
                                   `Error: el asiento contable, ya tiene un <em>número de asiento Contab</em>.`);


        console.log("1) asiento contable leído desde sql: ", asientoContable)

        // por alguna razón, sequelize v5 regresa dates como strings (???!!!) )
        asientoContable.fecha = ensureValueIsDate(asientoContable.fecha); 

        console.log("2) asiento contable leído desde sql: ", asientoContable)

        let numeroAsientoContab = ContabFunctions.determinarNumeroAsientoContab(asientoContable.fecha,
                                                                                asientoContable.tipo,
                                                                                asientoContable.cia);

        if (numeroAsientoContab.error) {
            throw new Meteor.Error("Error-asignar-numeroContab",
                                   `Error: ha ocurrido un error al intentar obtener un número de asiento Contab. <br />
                                   El mensaje específico del error es: <br />
                                   ${numeroAsientoContab.errMessage}`);

        }

        // -----------------------------------------------------------------------
        // finalmente, debemos actualizar el asiento en sql server
        let query = `Update Asientos Set Numero = ? Where NumeroAutomatico = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ numeroAsientoContab.numeroAsientoContab, numeroAutomatico ],
                                     type: sequelize.QueryTypes.UPDATE })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        return { 
            error: false, 
            message: `Ok, hemos asignado el número <b>${numeroAsientoContab.numeroAsientoContab.toString()}</b> al asiento contable.`, 
            asientoContableID: numeroAutomatico, 
        };
    }
})
