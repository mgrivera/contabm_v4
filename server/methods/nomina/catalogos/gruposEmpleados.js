
Meteor.methods(
{
    'nomina.gruposEmpleados.leerDesdeSql': function (ciaContab) {

        check(ciaContab, Match.Integer);

        let response = null;
        response = Async.runSync(function(done) {
            tGruposEmpleados_sql.findAll({ where: { cia: ciaContab }, 
                                           include: [ { model: tdGruposEmpleados_sql, as: 'empleados' } ], 
                                           // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let gruposEmpleados = []; 

        for (const g of response.result) { 

            const grupo = { 
                grupo: g.dataValues.grupo, 
                nombre: g.dataValues.nombre,  
                descripcion: g.dataValues.descripcion,  
                grupoNominaFlag: g.dataValues.grupoNominaFlag,  
                cia: g.dataValues.cia,  
                empleados: []
            } 

            let empleados = []; 

            for (const e of g.dataValues.empleados) { 

                const empleado = { 
                    claveUnica: e.claveUnica, 
                    empleado: e.empleado, 
                    grupo: e.grupo, 
                    suspendidoFlag: e.suspendidoFlag
                }

                empleados.push(empleado); 
            }

            grupo.empleados = empleados; 

            gruposEmpleados.push(grupo)
        }

        return { 
            error: false, 
            message: '', 
            items: gruposEmpleados, 
        }; 
    }, 


    'nomina.gruposEmpleados.saveToSql': function (items) {

        let response = null; 

        for (const grupoNomina of items) {

            if (grupoNomina.docState == 1) {
                // sequelize ignora algunas propiedades que no estén en el modelo; por eso no las eliminamos antes;
                // por eso dejamos valores como docState, etc., que no existen en el modelo 
                grupoNomina.grupo = 0;      // para items nuevos, normalmente el pk viene con un valor negativo 

                response = null; 
                response = Async.runSync(function (done) {
                    tGruposEmpleados_sql.create(grupoNomina)
                        .then(function (result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                })

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }

                // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
                const savedItem = response.result.dataValues;

                // ---------------------------------------------------------------------------------------------------
                // registramos los children, si existen 
                grupoNomina.empleados.forEach((empleado) => {
                    empleado.claveUnica = 0;      // para items nuevos, normalmente el pk viene con un valor negativo 
                    empleado.grupo = savedItem.grupo; 

                    response = null; 
                    response = Async.runSync(function (done) {
                        tdGruposEmpleados_sql.create(empleado)
                            .then(function (result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    })

                    if (response.error) {
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }
                })
            }


            if (grupoNomina.docState == 2) {

                response = null; 
                response = Async.runSync(function (done) {
                    tGruposEmpleados_sql.update(grupoNomina, { where: { grupo: grupoNomina.grupo } })
                        .then(function (result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                })

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }

                grupoNomina.empleados.forEach((x) => {
                    let response = null;

                    if (x.docState == 1) {
                        x.claveUnica = 0;
                        response = Async.runSync(function (done) {
                            tdGruposEmpleados_sql.create(x)
                                .then(function (result) { done(null, result); })
                                .catch(function (err) { done(err, null); })
                                .done();
                        })
                    }
                    else if (x.docState == 2) {
                        response = Async.runSync(function (done) {
                            tdGruposEmpleados_sql.update(x, { where: { claveUnica: x.claveUnica, } })
                                .then(function (result) { done(null, result); })
                                .catch(function (err) { done(err, null); })
                                .done();
                        })
                    }
                    else if (x.docState == 3) {
                        response = Async.runSync(function (done) {
                            tdGruposEmpleados_sql.destroy({ where: { claveUnica: x.claveUnica, } })
                                .then(function (result) { done(null, result); })
                                .catch(function (err) { done(err, null); })
                                .done();
                        })
                    }
                    
                    if (response.error) {
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }
                })
            }


            if (grupoNomina.docState == 3) {
                // sql elimina (cascade delete) de las tablas relacionadas en sql server ...
                response = null; 
                response = Async.runSync(function (done) {
                    tGruposEmpleados_sql.destroy({ where: { grupo: grupoNomina.grupo } })
                        .then(function (result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                })

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            }
        }

        return {
            error: false,
            message: '',
        };
    }
})