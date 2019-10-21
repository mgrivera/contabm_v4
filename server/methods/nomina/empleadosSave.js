

import { Meteor } from 'meteor/meteor'
import moment from 'moment';
import { TimeOffset } from '/globals/globals'; 

import { Empleados_sql, EmpleadosFaltas_sql, EmpleadosSueldo_sql } from '/server/imports/sqlModels/nomina/catalogos/empleados'; 

Meteor.methods(
{
    empleadosSave: function (empleado) {

        if (!empleado || !empleado.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        let usuario = Meteor.users.findOne(Meteor.userId());
        let docState = empleado.docState;

        if (empleado.docState == 1) {
            delete empleado.docState;

            // debemos asignar algunos valores antes de agregar el asiento a mongo y a sql server
            empleado.sueldos.forEach((x) => { delete x.docState; });
            empleado.faltas.forEach((x) => { delete x.docState; });

            // ----------------------------------------------------------------------------------------------------------------
            // sequelize siempre convierte las fechas a utc; nuestro offset en ccs es -4.00; sequelize va a sumar 4.30 para
            // llevar a utc; restamos 4.00 para eliminar este efecto ...
            let empleado_sql = lodash.cloneDeep(empleado);

            empleado_sql.fechaNacimiento = empleado_sql.fechaNacimiento ? moment(empleado_sql.fechaNacimiento).subtract(TimeOffset, 'hours').toDate() : null;
            empleado_sql.fechaIngreso = empleado_sql.fechaIngreso ? moment(empleado_sql.fechaIngreso).subtract(TimeOffset, 'hours').toDate() : null;
            empleado_sql.fechaRetiro = empleado_sql.fechaRetiro ? moment(empleado_sql.fechaRetiro).subtract(TimeOffset, 'hours').toDate() : null;

            empleado_sql.faltas.forEach((x) => {
                x.desde = x.desde ? moment(x.desde).subtract(TimeOffset, 'hours').toDate() : null;
                x.hasta = x.hasta ? moment(x.hasta).subtract(TimeOffset, 'hours').toDate() : null;
                x.descontar_FechaNomina = x.descontar_FechaNomina ? moment(x.descontar_FechaNomina).subtract(TimeOffset, 'hours').toDate() : null;
            })

            empleado_sql.sueldos.forEach((x) => {
                x.desde = x.desde ? moment(x.desde).subtract(TimeOffset, 'hours').toDate() : null;
            })

            // sequelize ignora algunas propiedades que no estén en el modelo; por eso no es neceario que las eliminemos antes;
            // ej: _id, arrays de faltas y sueldos, etc.
            response = Async.runSync(function(done) {
                Empleados_sql.create(empleado_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            // ---------------------------------------------------------------------------------------------------
            // finalmente, actualizamos los arrays de faltas y sueldos
            empleado_sql.sueldos.forEach((sueldo) => {
                sueldo.empleadoID = savedItem.empleado;
                sueldo.id = 0;      // para que sequelize no intente usar identity-insert y mantener el valor del pk 

                response = Async.runSync(function(done) {
                    EmpleadosSueldo_sql.create(sueldo)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }    
            })

            empleado_sql.faltas.forEach((falta) => {
                falta.empleadoID = savedItem.empleado;
                falta.id = 0;      // para que sequelize no intente usar identity-insert y mantener el valor del pk 

                response = Async.runSync(function(done) {
                    EmpleadosFaltas_sql.create(falta)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                })

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            })

            empleado.empleado = savedItem.empleado;
        }


        if (empleado.docState == 2) {
            delete empleado.docState;

            let empleado_sql = lodash.cloneDeep(empleado);

            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            empleado_sql.fechaNacimiento = empleado_sql.fechaNacimiento ? moment(empleado_sql.fechaNacimiento).subtract(TimeOffset, 'hours').toDate() : null;
            empleado_sql.fechaIngreso = empleado_sql.fechaIngreso ? moment(empleado_sql.fechaIngreso).subtract(TimeOffset, 'hours').toDate() : null;
            empleado_sql.fechaRetiro = empleado_sql.fechaRetiro ? moment(empleado_sql.fechaRetiro).subtract(TimeOffset, 'hours').toDate() : null;

            empleado_sql.faltas.forEach((x) => {
                x.desde = x.desde ? moment(x.desde).subtract(TimeOffset, 'hours').toDate() : null;
                x.hasta = x.hasta ? moment(x.hasta).subtract(TimeOffset, 'hours').toDate() : null;
                x.descontar_FechaNomina = x.descontar_FechaNomina ? moment(x.descontar_FechaNomina).subtract(TimeOffset, 'hours').toDate() : null;
            })

            empleado_sql.sueldos.forEach((x) => {
                x.desde = x.desde ? moment(x.desde).subtract(TimeOffset, 'hours').toDate() : null;
            })

            response = Async.runSync(function(done) {
                Empleados_sql.update(empleado_sql, { where: { empleado: empleado_sql.empleado }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            // ---------------------------------------------------------------------
            // recorremos los items que el usuario editó en el array; agregamos de
            // acuerdo a 'docState' ...
            if (!Array.isArray(empleado_sql.sueldos)) { 
                empleado_sql.sueldos = [];
            }
                
            lodash(empleado_sql.sueldos).filter((x) => { return x.docState; }).forEach((x) => {
                let response = null;

                if (x.docState == 1) {
                    x.id = 0;
                    response = Async.runSync(function(done) {
                        EmpleadosSueldo_sql.create(x)
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    })
                }
                else if (x.docState == 2) {
                    response = Async.runSync(function(done) {
                        EmpleadosSueldo_sql.update(x, { where: { id: x.id, }})
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    })
                }
                else if (x.docState == 3) {
                    response = Async.runSync(function(done) {
                        EmpleadosSueldo_sql.destroy({ where: { id: x.id, } })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    })
                }

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }   
            })
        }


        if (empleado.docState == 3) {
            // sql elimina (cascade delete) las tablas relacionadas en sql server ...
            response = Async.runSync(function(done) {
                Empleados_sql.destroy({ where: { empleado: empleado.empleado } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }

        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: empleado.empleado.toString()
        }
    }
})
