

import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    eliminarAsientosSql: function (anoFiscal, ciaContabID) {

        new SimpleSchema({
            anoFiscal: { type: SimpleSchema.Integer, optional: false, },
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ anoFiscal, ciaContabID, });

        hacerTiempo(5000).then((result) => { 
            let message = `Ok, los asientos contables que corresponden al año fiscal ${anoFiscal} 
                           se han eliminado de la base de datos.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???
    
            return { 
                error: false, 
                message: message, 
            }
        }).catch((err) => { 
            let message = `Error: ha ocurrido un error al intentar ejecutar este método. <br /> 
                           El mensaje de error específico es: ${err}`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???
    
            return { 
                error: true, 
                message: message, 
            }
        })
    }
})

function hacerTiempo(time: number) { 
    return new Promise((resolve, reject) => { 
        setTimeout(function(){ 
            resolve('Listo! se ha esperado el tiempo indicado ...'); 
         }, time);
    }); 
}
