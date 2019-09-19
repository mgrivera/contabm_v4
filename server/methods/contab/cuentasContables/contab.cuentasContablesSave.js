

import lodash from 'lodash';
import { CuentasContables_sql } from '/server/imports/sqlModels/contab/cuentasContables'; 
import { dAsientosContables_sql } from '/server/imports/sqlModels/contab/asientosContables'; 

Meteor.methods(
{
    'contab.cuentasContablesSave': function (items) {

        if (!Array.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        for (const item of inserts) {

            // al poner 0 evitamos que sequelize use Identity-Insert y use ese valor como pk (que ahora no es la idea)
            item.id = 0;   

            const validarCuenta = validarCuentaContable(item); 

            if (validarCuenta.error) { 
                return { 
                    error: true, 
                    message: validarCuenta.message, 
                }
            }

            let response = null;

            response = Async.runSync(function(done) {
                CuentasContables_sql.create(item)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            item.id = savedItem.id;     // recuperamos el id (pk) de la cuenta; pues se le asignó un valor en sql ...
        }


        var updates = lodash.chain(items)
                            .filter(function (item) { return item.docState && item.docState == 2; })
                            .map(function (item) { delete item.docState; return item; })               // eliminamos docState del objeto
                            .value();

        for (const item of updates) {

            const validarCuenta = validarCuentaContable(item); 

            if (validarCuenta.error) { 
                return { 
                    error: true, 
                    message: validarCuenta.message, 
                }
            }

            let response = null;

            response = Async.runSync(function(done) {
                CuentasContables_sql.update(item, { where: { id: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }


        // ordenamos por numNiveles (en forma descendente) para que siempre validemos primero las cuentas de más
        // niveles y luego las que las agrupan; ejemplo: si el usuario quiere eliiminar: 50101 y 50101001, leemos
        // (y validamos) primero la cuenta 50101001 y luego 50101 ...
        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      orderBy(['numNiveles'], ['desc']).
                      value();

        for (const item of removes) {

            let response = null;

            // el usuario no debe eliminar cuentas con asientos contables asociados
            response = Async.runSync(function(done) {
                dAsientosContables_sql.count({ where: { cuentaContableID: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            if (response.result > 0) { 
                const message = `Error: la cuenta contable <b>${item.cuenta}</b> 
                                 tiene asientos contables asociados; no puede ser eliminada.`; 

                return { 
                    error: true, 
                    message: message, 
                }
            }

            // el usuario no debe eliminar cuentas con cuentas contables asociadas ('hijas')
            response = Async.runSync(function(done) {
                CuentasContables_sql.count({ where: { $and:
                    [
                        { cuenta: { $like: `${item.cuenta}%` }},
                        { cuenta: { $ne: item.cuenta }},
                        { cia: item.cia }
                    ] }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            if (response.result > 0) { 
                const message = `Error: la cuenta contable <b>${item.cuenta}</b> tiene cuentas contables asociadas; 
                                 no puede ser eliminada..`; 

                return { 
                    error: true, 
                    message: message, 
                }
            }

            // finalmente, si la cuenta no falla las validaciones, la eliminamos ...
            response = Async.runSync(function(done) {
                CuentasContables_sql.destroy({ where: { id: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }

        return { 
            error: false, 
            message: "Ok, los datos han sido actualizados en la base de datos.", 
        }
    }
})

function validarCuentaContable(cuenta) { 

    let response = null; 

    // no deben haber dos cuentas iguales para la misma cia contab 
    response = Async.runSync(function(done) {
        CuentasContables_sql.count({ where: { $and:
            [
                { cuenta: { $eq: cuenta.cuenta }},
                { id: { $ne: cuenta.id }},
                { cia: { $eq: cuenta.cia }}, 
            ] }})
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    if (response.result > 0) { 
        const message = `Error: aparentemente, la cuenta contable <b>${cuenta.cuenta}</b> ha sido agregada antes.<br />
                         Por favor revise.`

        return { 
            error: true, 
            message: message, 
        }
    }

    // una cuenta de tipo total no debe tener asientos
    if (cuenta.totDet == "T") {
        response = Async.runSync(function(done) {
            dAsientosContables_sql.count({ where: { cuentaContableID: cuenta.id }})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (response.result > 0) { 
            const message = `Error: la cuenta contable <b>${cuenta.cuenta}</b> tiene asientos
                             contables asociados; no puede ser de tipo <em><b>total</b></em>.`

            return { 
                error: true, 
                message: message, 
            }
        }
    }

    // una cuenta de tipo detalle no debe tener otras cuentas asociadas (ie: hijas) ...
    if (cuenta.totDet == "D") {
        response = Async.runSync(function(done) {
            CuentasContables_sql.count({ where: { $and:
                [
                    { cuenta: { $like: `${cuenta.cuenta}%` }},
                    { cuenta: { $ne: cuenta.cuenta }},
                    { cia: cuenta.cia }
                ] }})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (response.result > 0) { 
            const message = `Error: la cuenta contable <b>${cuenta.cuenta}</b> tiene cuentas
                             contables asociadas; no puede ser de tipo <em><b>detalle</b></em>.`

            return { 
                error: true, 
                message: message, 
            }
        }
    }

    // una cuenta con más de dos niveles debe tener un padre 
    if (cuenta.numNiveles > 1) {

        // construimos el nivel anterior 
        let nivelAnterior = ""; 
        for (let j = 1; j < cuenta.numNiveles; j++) { 
            switch (j) { 
                case 1: 
                    nivelAnterior = cuenta.nivel1; 
                    break; 
                case 2: 
                    nivelAnterior += cuenta.nivel2; 
                    break; 
                case 3: 
                    nivelAnterior += cuenta.nivel3; 
                    break; 
                case 4: 
                    nivelAnterior += cuenta.nivel4; 
                    break; 
                case 5: 
                    nivelAnterior += cuenta.nivel5; 
                    break; 
                case 6: 
                    nivelAnterior += cuenta.nivel6; 
                    break;
                default: 
                    return { 
                        error: true, 
                        message: `Error: aparentemente, la cuenta contable ${cuenta} no está bien construida. <br />
                                  Por favor revise. Recuerde que una cuenta contable no puede tener más de 7 niveles.`,
                    } 
                
            }
        }

        // buscamos el nivel anterior de la cuenta; debe exisitr para cuentas de dos o más niveles 
        response = Async.runSync(function(done) {
            CuentasContables_sql.findOne({ where: { $and:
                [
                    { cuenta: { $eq: nivelAnterior }},
                    { cia: cuenta.cia }
                ] }})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        const cuentaContableParent = response.result; 

        if (!cuentaContableParent) { 
            const message = `Error: Ud. está intentando agregar la cuenta contable <b>${cuenta.cuenta}</b>, 
                             pero la cuenta <b>${nivelAnterior}</b> no existe.<br /> 
                             Por favor revise.`

            return { 
                error: true, 
                message: message, 
            }
        }

        if (cuentaContableParent.totDet == "D") { 
            const message = `Error: Ud. está intentando agregar la cuenta contable <b>${cuenta.cuenta}</b>, y de tipo detalle, 
                             pero la cuenta <b>${nivelAnterior}</b> ya es de tipo detalle.<br /> 
                             Por favor revise.`

            return { 
                error: true, 
                message: message, 
            }
        }
    }

    return { 
        error: false, 
    }
}
