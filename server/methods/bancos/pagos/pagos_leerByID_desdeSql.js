

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';

import { Pagos_sql } from '/server/imports/sqlModels/bancos/pagos'; 
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'pago.leerByID.desdeSql': function (pk) {

        new SimpleSchema({
            pk: { type: SimpleSchema.Integer, optional: false, }
        }).validate({ pk });

        let response = null;
        response = Async.runSync(function(done) {
            Pagos_sql.findAll(
                {
                    where: { claveUnica: pk },
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
        if (!response.result.length) {
            return { 
                error: false, 
                message: '', 
                pago: null, 
                proveedor: null, 
            }
        }

        const pago = response.result[0];

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        pago.fecha = pago.fecha ? moment(pago.fecha).add(TimeOffset, 'hours').toDate() : null;
        pago.ingreso = pago.ingreso ? moment(pago.ingreso).add(TimeOffset, 'hours').toDate() : null;
        pago.ultAct = pago.ultAct ? moment(pago.ultAct).add(TimeOffset, 'hours').toDate() : null;

        // ---------------------------------------------------------------------------------------------------
        // ahora leemos el proveedor, para regresarlo con el pago 
        let query = `Select Proveedor as proveedor, Nombre as nombre,  
                     ProveedorClienteFlag as proveedorClienteFlag, MonedaDefault as monedaDefault, 
                     Concepto as concepto 
                     From Proveedores  
                     Where Proveedor = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ pago.proveedor ],
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
            pago: JSON.stringify(pago), 
            proveedor: JSON.stringify(proveedor), 
        }
    }
})
