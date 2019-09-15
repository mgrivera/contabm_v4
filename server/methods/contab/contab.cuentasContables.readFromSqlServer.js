

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
        let query = `Select c.ID as id, (c.Cuenta + ' ' + c.Descripcion) as descripcion, Cia as cia  
                     From CuentasContables c
                     Where ${where}  
                     Order By c.Cuenta, c.Descripcion
                    `;

        response = null;
        response = Async.runSync(function(done) {
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
    }
})