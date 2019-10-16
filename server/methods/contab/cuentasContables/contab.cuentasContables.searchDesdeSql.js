

import { Meteor } from 'meteor/meteor'
import { Async } from 'meteor/meteorhacks:async';

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    'contab.cuentasContables.searchDesdeSql': function (search, ciaContabSeleccionada) {

        new SimpleSchema({
            search: { type: String, optional: false, }, 
            ciaContabSeleccionada: { type: Number, optional: false, },
        }).validate({ search, ciaContabSeleccionada, });

        // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*' que el usuario haya agregado
        let criteria = search.replace(/\*/g, '');
        criteria = `%${criteria}%`;

        const where = `((c.Cuenta Like '${criteria}') Or (c.Descripcion Like '${criteria}'))`;

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        const query = `Select c.ID as id, c.Cuenta as cuenta, 
                       (LTRIM(RTRIM(c.Cuenta)) + ' ' + LTRIM(RTRIM(c.Descripcion)) + ' ' + LTRIM(RTRIM(cs.Abreviatura))) as descripcion, 
                       c.Cia as cia  
                       From CuentasContables c Inner Join Companias cs On c.Cia = cs.Numero 
                       Where ${where} And c.Cia = ${ciaContabSeleccionada} And c.TotDet = 'D' And c.ActSusp = 'A' 
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


    'contab.cuentasContables.leerDesdeSqlServerRegresarCuentaCompleta': function (search, ciaContabSeleccionada) {

        new SimpleSchema({
            search: { type: String, optional: false, min: 0, }, 
            ciaContabSeleccionada: { type: Number, optional: false, },
        }).validate({ search, ciaContabSeleccionada, });

        // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*' que el usuario haya agregado
        let where = "(1 = 1)"; 

        if (search) { 
            let criteria = search.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where = `((c.Cuenta Like '${criteria}') Or (c.Descripcion Like '${criteria}'))`;
        }
        

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        let query = `Select ID as id, Cuenta as cuenta, Descripcion as descripcion, Nivel1 as nivel1, Nivel2 as nivel2, 
                     Nivel3 as nivel3, Nivel4 as nivel4, Nivel5 as nivel5, Nivel6 as nivel6, 
                     Nivel7 as nivel7, NumNiveles as numNiveles, TotDet as totDet, 
                     ActSusp as actSusp, CuentaEditada as cuentaEditada, Grupo as grupo, 
                     PresupuestarFlag as presupuestarFlag, Cia as cia  
                     From CuentasContables c
                     Where ${where} And c.Cia = ${ciaContabSeleccionada} 
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
            message: `<b>${response.result.length}</b> cuentas contables leídas para la <em>compañía Contab</em> seleccionada ...`, 
            cuentasContables: response.result
        }
    }
})