

import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema';
import { Departamentos_sql } from '../../../imports/sqlModels/nomina/catalogos/departamentos'; 
import { TiposDeProducto_sql } from '../../../imports/sqlModels/contab/tiposProducto'; 

// leemos los catálogos necesarios para el registro de proveedores desde sql server
// nota: algunos católogos existen siempre en mongo; éstos no y hay que leerlos siempre desde sql
Meteor.methods(
    {
        'contab.activosFijos.leerTablasCatalogosDesdeSqlServer': function (ciaContab) {

            new SimpleSchema({
                ciaContab: { type: Number, optional: false, },
            }).validate({ ciaContab, });

            // tDepartamentos
            let response: any = null;
            response = Async.runSync(function (done) {
                Departamentos_sql.findAll({
                    order: [['descripcion', 'ASC']],
                    raw: true,
                })
                    .then(function (result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            let departamentos = response.result;

            // TiposDeProducto
            response = null;
            response = Async.runSync(function (done) {
                TiposDeProducto_sql.findAll({
                    order: [['descripcion', 'ASC']],
                    raw: true,
                })
                    .then(function (result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            let tiposProducto = response.result;

            return JSON.stringify({
                departamentos: departamentos,
                tiposProducto: tiposProducto,
            });
        }
})