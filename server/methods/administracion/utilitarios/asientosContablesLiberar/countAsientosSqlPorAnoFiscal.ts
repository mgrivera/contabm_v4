

import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    countAsientosSqlPorAnoFiscal: function (ciaContabID) {

        new SimpleSchema({
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ ciaContabID, });

        let items = [ 
            { ano: 2008, count: 3850, }, 
            { ano: 2009, count: 4500, }, 
            { ano: 2010, count: 1385, }, 
            { ano: 2011, count: 2500, }, 
            { ano: 2012, count: 9850, }, 
            { ano: 2013, count: 5400, }, 
            { ano: 2014, count: 3001, }, 
            { ano: 2015, count: 910, }, 
            { ano: 2016, count: 4875, }, 
            { ano: 2017, count: 1900, }, 
            { ano: 2018, count: 8700, }, 
            { ano: 2019, count: 150, }, 
        ]; 

        return hacerTiempo(5000, items); 
    }
})

const hacerTiempo = (time: number, items: {}[]) => { 
    return new Promise((resolve, reject) => { 
        setTimeout(function(){ 

            let message = `Ok, la cantidad de asientos contables por año fiscal, ha sido leída de forma satisfactoria.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???
    
            resolve({ 
                error: false, 
                message: message, 
                items: items
            }) 

         }, time);
    }); 
}
