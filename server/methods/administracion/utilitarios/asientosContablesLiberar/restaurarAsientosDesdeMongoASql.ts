

import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    restaurarAsientosDesdeMongoASql: function (anoFiscal, ciaContabID) {

        new SimpleSchema({
            anoFiscal: { type: SimpleSchema.Integer, optional: false, },
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ anoFiscal, ciaContabID, });



        let message = `Ok, los asientos contables que corresponden al año fiscal ${anoFiscal} han sido restaurados.`; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: `Ok, los asientos contables que corresponden al año fiscal ${anoFiscal} han sido restaurados.`, 
        }

        
    }
});