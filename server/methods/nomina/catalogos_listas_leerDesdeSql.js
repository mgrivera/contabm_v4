

Meteor.methods(
{
    empleados_lista_leerDesdeSql: function (ciaContab) {

        check(ciaContab, Match.Integer);

        let response = null;
        response = Async.runSync(function(done) {
            Empleados_sql.findAll({ 
                    where: { cia: ciaContab }, 
                    attributes: ['empleado', 'nombre', 'alias'], 
                    order: [ ['nombre', 'ASC'] ], 
                    raw: true,      
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        return { 
            error: false, 
            message: '', 
            items: response.result, 
        }
    }
})