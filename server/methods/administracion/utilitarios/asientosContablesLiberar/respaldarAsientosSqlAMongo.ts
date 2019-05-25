

import { sequelize } from 'server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    respaldarAsientosSqlAMongo: function (anoFiscal, ciaContabID) {

        new SimpleSchema({
            anoFiscal: { type: SimpleSchema.Integer, optional: false, },
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ anoFiscal, ciaContabID, });

        let message = `Ok, los asientos contables que corresponden al año fiscal ${anoFiscal} han sido respaldados.`; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: message, 
        }
    }
});