

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'; 
import { sequelize } from 'server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import * as moment from 'moment'; 

import { AsientosContables_respaldo_headers } from "imports/collections/contab/asientosContables_respaldo";
import { AsientosContables_respaldo_asientos } from "imports/collections/contab/asientosContables_respaldo";
import { AsientosContables_respaldo_partidas } from "imports/collections/contab/asientosContables_respaldo";

Meteor.methods(
{
    respaldarAsientosSqlAMongo: function (anoFiscal, ciaContabID) {

        new SimpleSchema({
            anoFiscal: { type: SimpleSchema.Integer, optional: false, },
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ anoFiscal, ciaContabID, });

        const usuario = Meteor.users.findOne(Meteor.userId() as string);

        // para intentar determinar el tiempo que tarda el proceso en completarse 
        const inicio = Date(); 

        // -----------------------------------------------------------------------------------------------------------
        // 1) escribimos un registro a la tabla ...header; luego actulizaremos con la cantidad de asientos y partidas 
        let header = {
            _id: new Mongo.ObjectID()._str, 
            anoFiscal: anoFiscal, 
            fecha: new Date(), 
            cantAsientos: 0, 
            cantPartidas: 0, 
            ciaContab: ciaContabID, 
            user: usuario.emails[0].address
        };

        const headerId = AsientosContables_respaldo_headers.insert(header);

        // -----------------------------------------------------------------------------------------------------------
        // 2) leemos los asientos que corresponden al año fiscal y a la compañía seleccionada 
        let query = `Select * From Asientos Where AnoFiscal = ? And Cia = ?`;

        let response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ anoFiscal, ciaContabID ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });


        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        const cantAsientos = response.result.length;
        
        for (let item of response.result) { 

            const asiento = { 
                _id: new Mongo.ObjectID()._str, 
                headerId: headerId, 
                item
            }

            AsientosContables_respaldo_asientos.insert(asiento);
        }

        // -----------------------------------------------------------------------------------------------------------
        // 3) leemos los asientos que corresponden al año fiscal y a la compañía seleccionada 
        query = `Select d.* From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico 
                 Where a.AnoFiscal = ? And a.Cia = ?`;

        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ anoFiscal, ciaContabID ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });


        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        const cantPartidas = response.result.length;
        
        for (let item of response.result) { 

            const partida = { 
                _id: new Mongo.ObjectID()._str, 
                headerId: headerId, 
                item
            }

            AsientosContables_respaldo_partidas.insert(partida);
        }


        const final = Date(); 

        // usamos moment para calcular la duración del proceso 
        var x = moment(inicio); 
        var y = moment(final); 
        var duration = moment.duration(x.diff(y)); 

        // -----------------------------------------------------------------------------------------------------------
        // 4) finalmente, actualizamos el header original con la cantidad de asientos y de partidas 
        AsientosContables_respaldo_headers.update({ _id: headerId }, { $set: { cantAsientos: cantAsientos, cantPartidas: cantPartidas }});

        let message = `Ok, los asientos contables que corresponden al año fiscal <b>${anoFiscal}</b>, en la compañía Contab
                       seleccionada, han sido respaldados.<br /> 
                       En total, se han copiado <b>${cantAsientos}</b> asientos contables y <b>${cantPartidas}</b> partidas.<br /> 
                       Ud. puede ahora eliminar ese año de la base de datos, para que las consultas contables se ejecuten en forma 
                       más eficiente.<br /> 
                       La duración total del proceso fue de: <em>${duration.humanize()}</em>. 
                       `; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: message, 
        }
    }
});