

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    'movBancos.leerProveedor': function (pk) {

        new SimpleSchema({
            pk: { type: Number, optional: false },
        }).validate({ pk });

        const query = `Select Proveedor as proveedor, Nombre as nombre, 
                     Beneficiario as beneficiario, Concepto as concepto, MontoCheque as montoCheque 
                     From Proveedores Where Proveedor = ?`;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ pk.toString(), ],
                    type: sequelize.QueryTypes.SELECT
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!Array.isArray(response.result) || !response.result.length) {
            return {
                error: true,
                message: `Error (inesperado): hemos obtenido un error al intentar leer la compañía desde la base de datos.<br /> 
                No hemos podido  leer la compañía en la base de datos. <br /> 
                Por favor revise.`,
            }
        }

        const proveedor = response.result[0];

        return { 
            error: false, 
            message: '', 
            proveedor: JSON.stringify(proveedor), 
        }
    }
})