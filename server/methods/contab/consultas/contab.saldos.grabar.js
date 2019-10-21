
// hacemos un save desde una consulta. La verdad es que nunca se actualizan los saldos contables de esta forma. 
// siempre con un cierre. esta es una excepción para corregir saldos que viene con muchos decimales desde hace 
// varios años 
import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema';

import { SaldosContables_sql } from '/server/imports/sqlModels/contab/saldosContables'; 
import { Temp_Consulta_SaldosContables } from '/imports/collections/contab/consultas/tempConsultaSaldosContables';

Meteor.methods({
    'contab.saldos.grabar': function (items) {

        new SimpleSchema({
            items: { type: Array, optional: false, minCount: 0, }, 
            'items.$': { type: Object, blackbox: true, }, 
        }).validate({ items });

        var updates = items.filter(function (item) { return item.docState && item.docState == 2; });

        updates.forEach(async (item) => {

            let response = null;

            // actualizamos el registro en sql ...
            try { 
                response = await SaldosContables_sql.update({ inicial: item.inicial}, 
                                       { where: { 
                                           cuentaContableID: item.cuentaContableID, 
                                           ano: item.ano, 
                                           moneda: item.moneda, 
                                           monedaOriginal: item.monedaOriginal, 
                                        }}); 

            } catch(err) { 
                throw new Meteor.Error(err);
            }

            // ahora actualizamos el registro en mongo; cómo es una consulta, la idea es que, al actualizar, los 
            // registros se vuelven a leer para mostrarlos actualizados 
            const mongoUpdated = Temp_Consulta_SaldosContables.update({ $and: [ { cuentaContableID: item.cuentaContableID }, 
                                                           { ano: item.ano }, 
                                                           { moneda: item.moneda }, 
                                                           { monedaOriginal: item.monedaOriginal }, 
                                                           { user: Meteor.userId() }, ]}, 
                                                           { $set: { inicial: item.inicial }, 
                                                             $unset: { docState: "" }});
        })

        return { 
            error: false, 
            message: "Ok, los datos han sido actualizados en la base de datos.", 
        }
    }
})
