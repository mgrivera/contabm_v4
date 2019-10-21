

import { Meteor } from 'meteor/meteor'
import { sequelize } from 'server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import * as moment from 'moment'; 

import { Companias } from 'imports/collections/companias';
import { CompaniaSeleccionada } from 'imports/collections/companiaSeleccionada';

import { AsientosContables_respaldo_headers } from "imports/collections/contab/asientosContables_respaldo";
import { AsientosContables_respaldo_asientos } from "imports/collections/contab/asientosContables_respaldo";
import { AsientosContables_respaldo_partidas } from "imports/collections/contab/asientosContables_respaldo";

import { AsientosContables_sql, dAsientosContables_sql } from "server/imports/sqlModels/contab/asientosContables"; 

Meteor.methods(
{
    restaurarAsientosDesdeMongoASql: function (anoFiscal, ciaContabID, headerId) {

        new SimpleSchema({
            anoFiscal: { type: SimpleSchema.Integer, optional: false, },
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
            headerId: { type: String, optional: false, },
        }).validate({ anoFiscal, ciaContabID, headerId, });

        // para intentar determinar el tiempo que tarda el proceso en completarse 
        const inicio = Date(); 

        let companiaSeleccionadaUsuario = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionadaUsuario) {
            let message = `Error inesperado: no pudimos leer la compañía Contab seleccionada por el usuario.<br />
                           No se ha seleccionado una compañía antes de ejecutar este proceso?`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        const companiaSeleccionada = Companias.findOne(companiaSeleccionadaUsuario ? companiaSeleccionadaUsuario.companiaID : -999, { fields: { abreviatura: 1 }});

        // antes que nada, intentamos leer un asiento para el año fiscal indicado. Si existe uno, terminamos con un error 
        let query = `Select Top 1 NumeroAutomatico From Asientos Where AnoFiscal = ? And Cia = ?`;

        let response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ anoFiscal, ciaContabID ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });


        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (response.result && Array.isArray(response.result) && response.result.length) { 
            let message = `Error: el año fiscal que se intenta restablecer, <em>${anoFiscal}</em>, para la compañía <em>contab</em> 
                       seleccionada, <em>${companiaSeleccionada.abreviatura}</em>, <b>ya existe</b> en <em>contab</em>.<br /> 
                       Por favor revise.<br /> 
                       Los asientos contables para el año fiscal que Ud. desee restablacer, <b>no deben existir</b> en 
                       <em>contab</em>.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        // ---------------------------------------------------------------------------------------------------------
        // Ok, ya sabemos que los asientos a restaurar no existen. Intentamos restablecerlos ... 

        // 1) leemos el header del respaldo de los asientos en mongo 
        const header = AsientosContables_respaldo_headers.findOne({ _id: headerId }); 

        if (!header) { 
            let message = `Error inesperado: no hemos podido leer el <em>header</em> que corresponde al respaldo de asientos 
                           contables que se ha seleccionado en la lista.<br /> 
                           Esto no ha debido ocurrir. Por favor revise.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        // 2) leemos los asientos que corresponden al header 
        const asientos = AsientosContables_respaldo_asientos.find({ headerId: header._id }).fetch(); 

        if (!asientos.length) { 
            let message = `Error: la cantidad de asientos respaldados en este respaldo de asientos contables, 
                           es cero.<br /> 
                           Por favor revise.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        // 3) leemos las partidas que corresponden al header 
        const partidas = AsientosContables_respaldo_partidas.find({ headerId: header._id }).fetch(); 

        if (!partidas.length) { 
            let message = `Error: la cantidad de partidas respaldadas en este respaldo de asientos contables, 
                           es cero.<br /> 
                           Por favor revise.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        let countAsientos = 0; 
        let countPartidas = 0; 

        let asientos_sql_array: {}[] = []; 

        // recorremos los asientos y grabamos a contabm 
        for (let asiento of asientos) { 

            // TODO: solo para comenzar, vamos a grabar 1 solo y debe fallar, pues vamos a intentar grabar sobre Identity 
            // (NumeroAutomatico) 
            const asiento_sql = { 
                numeroAutomatico: asiento.item.NumeroAutomatico,
                numero: asiento.item.Numero,
                mes: asiento.item.Mes,
                ano: asiento.item.Ano,
                tipo: asiento.item.Tipo,
                fecha: asiento.item.Fecha,
                descripcion: asiento.item.Descripcion,
                moneda: asiento.item.Moneda,
                monedaOriginal: asiento.item.MonedaOriginal,
                convertirFlag: asiento.item.ConvertirFlag,
                factorDeCambio: asiento.item.FactorDeCambio,
                provieneDe: asiento.item.ProvieneDe,
                provieneDe_id: asiento.item.ProvieneDe_ID,
                ingreso: asiento.item.Ingreso,
                ultAct: asiento.item.UltAct,
                copiableFlag: asiento.item.CopiableFlag,
                asientoTipoCierreAnualFlag: asiento.item.AsientoTipoCierreAnualFlag,
                mesFiscal: asiento.item.MesFiscal,
                anoFiscal: asiento.item.AnoFiscal, 
                usuario: asiento.item.Usuario,
                lote: asiento.item.Lote,
                cia: asiento.item.Cia,
            }

            asientos_sql_array.push(asiento_sql); 

            countAsientos++; 
        }

        // nótese como grabamos el asiento y sus partidas (Asientos/dAsientos)
        response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.bulkCreate(asientos_sql_array)
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }


        // ya grabamos los asientos; ahora vamos a grabar las partidas 
        let partidas_sql_array: {}[] = []; 

        // recorremos los asientos y grabamos a contabm 
        for (let partida of partidas) { 

            // TODO: solo para comenzar, vamos a grabar 1 solo y debe fallar, pues vamos a intentar grabar sobre Identity 
            // (NumeroAutomatico) 
            const partida_sql = { 
                numeroAutomatico: partida.item.NumeroAutomatico,
                partida: partida.item.Partida,
                cuentaContableID: partida.item.CuentaContableID,
                descripcion: partida.item.Descripcion,
                referencia: partida.item.Referencia,
                debe: partida.item.Debe,
                haber: partida.item.Haber,
                centroCosto: partida.item.CentroCosto,
            }

            partidas_sql_array.push(partida_sql); 

            countPartidas++; 
        }

        // nótese como grabamos el asiento y sus partidas (Asientos/dAsientos)
        response = null;
        response = Async.runSync(function(done) {
            dAsientosContables_sql.bulkCreate(partidas_sql_array)
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        const final = Date(); 

        // usamos moment para calcular la duración del proceso 
        var x = moment(inicio); 
        var y = moment(final); 
        var duration = moment.duration(x.diff(y)); 


        let message = `Ok, los asientos contables que corresponden al año fiscal <b>${anoFiscal}</b> han sido restablecidos.
                       En total, se han restablecido: <b>${countAsientos}</b> asientos contables, que contienen un total de
                       <b>${countPartidas}</b> partidas.<br /> 
                       La duración total del proceso fue de: <em>${duration.humanize()}</em>. `; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: message, 
        }
    }
})
