

import { sequelize } from 'server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

import { MesesDelAnoFiscal_sql } from 'server/imports/sqlModels/contab/contab'; 
import { Companias } from 'imports/collections/companias';
import { CompaniaSeleccionada } from 'imports/collections/companiaSeleccionada';

Meteor.methods(
{
    countAsientosSqlPorAnoFiscal: function (ciaContabID) {

        new SimpleSchema({
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ ciaContabID, });

        // leemos la compañía seleccionada por el usuario 
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

        // ahora leemos la cantidad de asientos en cada año fiscal 
        let query = ""; 
        let response: any = null;

        query = `Select Count(*) as contaAsientos, AnoFiscal as anoFiscal 
                 From Asientos Where Cia = ? Group by AnoFiscal Order by AnoFiscal 
                 `;

        response = Async.runSync(function(done: any) {
            sequelize.query(query, { replacements: [ ciaContabID ], type: sequelize.QueryTypes.SELECT })
                .then(function(result: any) { done(null, result); })
                .catch(function (err: any) { done(err, null); })
                .done();
        });
    
        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
    
        if (response.result.length == 0) {
            const message = `Error: no hemos podido leer asientos contables para la compañía seleccionada.`;
    
            return { 
                error: true, 
                message: message };
        }

        // para leer los nombres del primer y último mes del año fiscal 
        const infoMesesAnoFiscal = leerNombresPrimerYUltimoMesesAnoFiscal(ciaContabID); 

        if (infoMesesAnoFiscal.error) { 
            return { 
                error: true, 
                message: infoMesesAnoFiscal.message, 
            }; 
        }

        const nombrePrimerMesAnoFiscal = infoMesesAnoFiscal.nombrePrimerMesAnoFiscal; 
        const anoFiscalPrimerMesFiscal = infoMesesAnoFiscal.anoFiscalPrimerMesFiscal;   
        const nombreUltimoMesAnoFiscal = infoMesesAnoFiscal.nombreUltimoMesAnoFiscal;  
        const anoFiscalUltimoMesFiscal = infoMesesAnoFiscal.anoFiscalUltimoMesFiscal;   

        // lo primero que hacemos es determinar si el número se genera de acuerdo al tipo del asiento
        const asientosContaAnoFiscal: {}[] = []; 
        
        for (const count of response.result) { 

            // leemos la cantidad de partidas que corresponden a todos los asientos del año fiscal ... 
            query = ""; 
            response = null;

            query = `Select Count(*) as contadAsientos 
                     From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico 
                     Where a.AnoFiscal = ? And a.Cia = ? 
                    `;

            response = Async.runSync(function(done: any) {
                sequelize.query(query, { replacements: [ count.anoFiscal, ciaContabID ], type: sequelize.QueryTypes.SELECT })
                    .then(function(result: any) { done(null, result); })
                    .catch(function (err: any) { done(err, null); })
                    .done();
            });
        
            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            let contaPartidas = 0; 
            if (response.result.length > 0) {
                contaPartidas = response.result[0].contadAsientos; 
            }

            // regresamos el nomobre del primero y último mes del año fiscal (ej: enero y diciembre); el año calendario 
            // puede ser el mismo año fiscal o el próximo ... 

            asientosContaAnoFiscal.push({ 
                nombrePrimerMesAnoFiscal: nombrePrimerMesAnoFiscal, 
                anoFiscalPrimerMesFiscal: (anoFiscalPrimerMesFiscal == 0) ? count.anoFiscal : (count.anoFiscal + 1), 
                nombreUltimoMesAnoFiscal: nombreUltimoMesAnoFiscal, 
                anoFiscalUltimoMesFiscal: (anoFiscalUltimoMesFiscal == 0) ? count.anoFiscal : (count.anoFiscal + 1), 
                anoFiscal: count.anoFiscal, 
                countAsientos: count.contaAsientos, 
                countPartidas: contaPartidas, 
                cia: ciaContabID, 
                nombreCia: companiaSeleccionada.abreviatura
            })
        }

        let message = `Ok, la cantidad de asientos contables por año fiscal, ha sido leída de forma satisfactoria.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: message, 
            items: asientosContaAnoFiscal
        }; 
    }
})


function leerNombresPrimerYUltimoMesesAnoFiscal(ciaContabID) { 

    // ahora leemos la identificación *primer* y *último* meses del año fiscal 
    let response:any = null;
    response = Async.runSync(function(done) {
        MesesDelAnoFiscal_sql.findAndCountAll({
            where: { mesFiscal: 1, cia: ciaContabID },
        })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    if (response.result.count == 0) {
        let message = `Error: No hemos encontrado un registro en la tabla de <em>meses fiscales</em> en Contab para
            el primer mes del año fiscal.<br />
            Por favor revise y corrija esta situación.`;
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: true, 
            message: message 
        };
    }

    let mesAnoFiscal = response.result.rows[0].dataValues;

    const nombrePrimerMesAnoFiscal = mesAnoFiscal.nombreMes; 
    const anoFiscalPrimerMesFiscal = mesAnoFiscal.ano;       // para saber si el año fiscal corresponde al mismo año calendario

    response = null;
    response = Async.runSync(function(done) {
        MesesDelAnoFiscal_sql.findAndCountAll({
            where: { mesFiscal: 12, cia: ciaContabID },
        })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    if (response.result.count == 0) {
        let message = `Error: No hemos encontrado un registro en la tabla de <em>meses fiscales</em> en Contab para
            el último mes del año fiscal.<br />
            Por favor revise y corrija esta situación.`;
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: true, 
            message: message 
        };
    }

    mesAnoFiscal = response.result.rows[0].dataValues;

    const nombreUltimoMesAnoFiscal = mesAnoFiscal.nombreMes; 
    const anoFiscalUltimoMesFiscal = mesAnoFiscal.ano;       // para saber si el año fiscal corresponde al mismo año calendario

    return { 
        error: false, 
        nombrePrimerMesAnoFiscal: nombrePrimerMesAnoFiscal,  
        anoFiscalPrimerMesFiscal: anoFiscalPrimerMesFiscal,  
        nombreUltimoMesAnoFiscal: nombreUltimoMesAnoFiscal,  
        anoFiscalUltimoMesFiscal: anoFiscalUltimoMesFiscal,  
    }
}
