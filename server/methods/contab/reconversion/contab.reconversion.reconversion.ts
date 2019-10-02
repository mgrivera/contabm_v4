

import { sequelize } from '../../../sqlModels/_globals/_loadThisFirst/_globals';

import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

// Según documentación de simpl-schema: 
// Validate a Meteor Method Argument and Satisfy audit-argument-checks
// To avoid errors about not checking all arguments when you are using SimpleSchema to validate Meteor method arguments, 
// you must pass check as an option when creating your SimpleSchema instance.

SimpleSchema.defineValidationErrorTransform(error => {
    const ddpError = new Meteor.Error(error.message);
    ddpError.error = 'validation-error';
    ddpError.details = error.details;
    return ddpError;
});

const meteorMethodArgsValidate_Schema = new SimpleSchema({
    moneda: { type: Array, label: 'Moneda', optional: false, minCount: 1, },
    'moneda.$': { type:  SimpleSchema.Integer },
    cuentaContable: { type: Array, label: 'Cuenta contable', optional: false, minCount: 1, maxCount: 1, },
    'cuentaContable.$': { type:  SimpleSchema.Integer },
    ano: { type: Array, label: 'Año', optional: false, minCount: 1, maxCount: 1, },
    'ano.$': { type:  SimpleSchema.Integer },
    dividirPor: { type: SimpleSchema.Integer, label: 'Monto divisor (dividir por)', optional: false, },
    cia: { type: SimpleSchema.Integer, optional: false, },
}, { check });


Meteor.methods(
{
    'contab.reconversion.reconversion': function (filtro) {

        meteorMethodArgsValidate_Schema.validate(filtro);

        // Now do other method stuff knowing that obj (ie: method arg) satisfies the schema ... 

        let filtroMoneda = 'Moneda In ('; 
        for (let moneda of filtro.moneda) { 

            if (filtroMoneda === 'Moneda In (') { 
                // primera vez ... 
                filtroMoneda += moneda.toString(); 
            } else { 
                filtroMoneda += `, ${moneda.toString()}`; 
            }
        }

        filtroMoneda += ')'; 

        let query = 'sp_contab_reconversion_reconversion';

        let response = Async.runSync(function (done) {
            sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT
            })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        return { 
            error: false, 
            message: `Ok, el proceso de reconversión se ha ejecutado en forma satisfactoria.`, 
            resultado: response, 
        };
    }
})