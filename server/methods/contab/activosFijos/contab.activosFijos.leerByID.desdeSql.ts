

import { sequelize } from 'server/sqlModels/_globals/_loadThisFirst/_globals';
import * as moment from 'moment';
import { TimeOffset } from '../../../../globals/globals'; 
import SimpleSchema from 'simpl-schema';

import { InventarioActivosFijos_sql } from '../../../imports/sqlModels/contab/inventarioActivosFijos'; 
import { Meteor } from 'meteor/meteor';

Meteor.methods(
{
    'contab.activosFijos.leerByID.desdeSql': function (pk) {

        new SimpleSchema({
            pk: { type: Number, optional: false, },
        }).validate({ pk });

        let response: any = null;
        response = Async.runSync(function(done) {
            InventarioActivosFijos_sql.findAll({ where: { claveUnica: pk }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let activoFijo = {} as any;

        if (response && response.result && response.result.length) {
            activoFijo = response.result[0];

            // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
            activoFijo.fechaCompra = activoFijo.fechaCompra ? moment(activoFijo.fechaCompra).add(TimeOffset, 'hours').toDate() : null;
            activoFijo.fechaDesincorporacion = activoFijo.fechaDesincorporacion ? moment(activoFijo.fechaDesincorporacion).add(TimeOffset, 'hours').toDate() : null;
            activoFijo.ingreso = activoFijo.ingreso ? moment(activoFijo.ingreso).add(TimeOffset, 'hours').toDate() : null;
            activoFijo.ultAct = activoFijo.ultAct ? moment(activoFijo.ultAct).add(TimeOffset, 'hours').toDate() : null;
        }

        // -------------------------------------------------------------------------------------------------
        // ahora leemos el proveedor asociado al activo fijo; también puede no haber uno asociado ... 
        const query = `Select Proveedor as proveedor, Nombre as nombre From Proveedores Where Proveedor = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ (activoFijo.proveedor ? activoFijo.proveedor : -999), ],
                    type: sequelize.QueryTypes.SELECT
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        const proveedor = response.result && response.result[0] ? response.result[0] : {};

        return { 
            error: false, 
            message: '', 
            activoFijo: JSON.stringify(activoFijo), 
            proveedor: JSON.stringify(proveedor), 
        }
    }
})