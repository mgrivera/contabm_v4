


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

        const where = `(c.Cuenta Like '${criteria}') Or (c.Descripcion Like '${criteria}')`;

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        let query = `Select c.ID as id, (c.Cuenta + ' ' + c.Descripcion) as descripcion 
                     From CuentasContables c
                     Where ${where} And c.Cia = ${ciaContabSeleccionada} And c.TotDet = 'D' And c.ActSusp = 'A' 
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
