

// para leer registros desde sql para llenar la lista del select2 que usamos en: facturas, movimientos, pagos 
// también en asientos, etc., con las cuentas contables. 
// Nota: en realidad, no usamos select2, sino ui-select (angular) que debe ser un packaging para select2 
import { Meteor } from 'meteor/meteor'
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    'bancos.getProveedoresParaSelect2': function (where) {

        new SimpleSchema({
            where: { type: String, optional: false },
        }).validate({ where, });

        let query = `Select Proveedor as proveedor, Nombre as nombre From Proveedores Where ${where}`;

        let response = null;
        response = Async.runSync(function (done) {
            sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT
            })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        return { 
            error: false, 
            message: ``, 
            items: response.result, 
        }
    }
})