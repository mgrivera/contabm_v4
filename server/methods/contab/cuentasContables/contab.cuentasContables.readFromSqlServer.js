

import { Meteor } from 'meteor/meteor'
import { Async } from 'meteor/meteorhacks:async';

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    // recibimos una lista de IDs de cuentas contables, las leemos desde sql server y las regresamos 
    'contab.cuentasContables.readFromSqlServer': function (listaCuentasContablesIDs) {

        new SimpleSchema({
            listaCuentasContablesIDs: { type: Array, optional: false, minCount: 0, }, 
            'listaCuentasContablesIDs.$': { type: Number, }, 
        }).validate({ listaCuentasContablesIDs });

        let where = ""; 

        if (Array.isArray(listaCuentasContablesIDs) && listaCuentasContablesIDs.length > 0) {

            let lista = "";

            listaCuentasContablesIDs.forEach((x) => {
                if (!lista) { 
                    lista = `(${x.toString()}`;
                }
                else { 
                    lista += `, ${x.toString()}`;
                }
            });

            lista += ")";
            where += `(c.ID In ${lista})`;
        }

        if (!where) { 
            where = `(1 = 2)`;
        }
        

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        const query = `Select c.ID as id, c.Cuenta as cuenta, 
                       (LTRIM(RTRIM(c.Cuenta)) + ' ' + LTRIM(RTRIM(c.Descripcion)) + ' ' + LTRIM(RTRIM(cs.Abreviatura))) as descripcion, 
                       c.Cia as cia  
                       From CuentasContables c Inner Join Companias cs On c.Cia = cs.Numero 
                       Where ${where}  
                       Order By c.Cuenta, c.Descripcion
                    `;

        const response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        return { 
            error: false, 
            cuentasContables: response.result
        }
    }, 

    // recibimos una lista de IDs de cuentas contables, las leemos desde sql server y las regresamos 
    'contab.cuentasContables.readFromSqlServer_porIDYCuenta': function (listaCuentasContablesIDs, listaCuentasContablesNumerosCuenta, ciaContabID) {

        // copiamos el método de arriba. Escencialmente, leemos cuentas dado una lista de IDs; pero, además, dada 
        // un grupo de cuentas y la cia contab seleccionada 

        new SimpleSchema({
            listaCuentasContablesIDs: { type: Array, optional: false, minCount: 0, }, 
            'listaCuentasContablesIDs.$': { type: Number, }, 
            listaCuentasContablesNumerosCuenta: { type: Array, optional: false, minCount: 0, }, 
            'listaCuentasContablesNumerosCuenta.$': { type: String, }, 
            ciaContabID: { type: Number, optional: false, }, 
        }).validate({ listaCuentasContablesIDs, listaCuentasContablesNumerosCuenta, ciaContabID });

        
        let cuentasContables = []; 

        // 1) leemos las cuentas que corresponden a los ids en la lista 
        if (Array.isArray(listaCuentasContablesIDs) && listaCuentasContablesIDs.length > 0) {

            let where = ""; 
            let lista = "";

            listaCuentasContablesIDs.forEach((x) => {
                if (!lista) { 
                    lista = `(${x.toString()}`;
                }
                else { 
                    lista += `, ${x.toString()}`;
                }
            });

            lista += ")";
            where += `(c.ID In ${lista})`;

            if (!where) { 
                where = `(1 = 2)`;
            }
            
            const query = `Select c.ID as id, c.Cuenta as cuenta, 
                           (LTRIM(RTRIM(c.Cuenta)) + ' ' + LTRIM(RTRIM(c.Descripcion)) + ' ' + LTRIM(RTRIM(cs.Abreviatura))) as descripcion, 
                           Cia as cia  
                           From CuentasContables c Inner Join Companias cs On c.Cia = cs.Numero 
                           Where ${where}  
                           Order By c.Cuenta, c.Descripcion
                          `;
    
            const response = Async.runSync(function(done) {
                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });
    
            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
    
            cuentasContables = response.result; 
        }


        // 2) leemos las cuentas, esta vez por los números de cuenta en la otra lista; además, debemos usar la cia aquí 
        // pues pueden haber cuentas con el mismo número (ej: 10010101) en diferentes cias ...  
        if (Array.isArray(listaCuentasContablesNumerosCuenta) && listaCuentasContablesNumerosCuenta.length > 0) {

            let where = ""; 
            let lista = "";

            listaCuentasContablesNumerosCuenta.forEach((x) => {
                if (!lista) { 
                    lista = `('${x}'`;
                }
                else { 
                    lista += `, '${x}'`;
                }
            });

            lista += ")";
            where += `(c.Cuenta In ${lista})`;

            if (!where) { 
                where = `(1 = 2)`;
            }

            const query = `Select c.ID as id, c.Cuenta as cuenta, 
                           (LTRIM(RTRIM(c.Cuenta)) + ' ' + LTRIM(RTRIM(c.Descripcion)) + ' ' + LTRIM(RTRIM(cs.Abreviatura))) as descripcion, 
                           Cia as cia  
                           From CuentasContables c Inner Join Companias cs On c.Cia = cs.Numero 
                           Where ${where} and c.Cia = ${ciaContabID}  
                           Order By c.Cuenta, c.Descripcion
                          `;

            const response = Async.runSync(function(done) {
                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });
    
            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // las agregamos al array solo si no se han agregado antes 
            response.result.forEach(x => { 
                const cuenta = cuentasContables.find(j => j.id === x.id); 
                if (!cuenta) { 
                    cuentasContables.push(x); 
                }
            })
        }

        return { 
            error: false, 
            cuentasContables: cuentasContables, 
        }
    }
})