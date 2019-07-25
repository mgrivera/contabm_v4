

Meteor.publish("vacaciones", function (filtro) {

    // leemos antes la vacación para obtener el empleado y regresarlo también ... 
    let vacacion = Vacaciones.findOne(filtro, { fields: { empleado: 1 }});

    let empleadoID = "xyz";
    if (vacacion) { 
        empleadoID = vacacion.empleado;
    }
        
    return [
        Vacaciones.find(filtro),
    ]
})