

import { Meteor } from 'meteor/meteor'
import { sequelize } from 'server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

import { Companias } from 'imports/collections/companias';
import { CompaniaSeleccionada } from 'imports/collections/companiaSeleccionada';

import { AsientosContables_respaldo_headers } from "imports/collections/contab/asientosContables_respaldo";
import { AsientosContables_respaldo_asientos } from "imports/collections/contab/asientosContables_respaldo";
import { AsientosContables_respaldo_partidas } from "imports/collections/contab/asientosContables_respaldo";

Meteor.methods(
{
    eliminarAsientosSql: function (anoFiscal, ciaContabID) {

        new SimpleSchema({
            anoFiscal: { type: SimpleSchema.Integer, optional: false, },
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ anoFiscal, ciaContabID, });

        // leemos la compañía seleccionada por el usuario 
        let companiaSeleccionadaUsuario = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionadaUsuario) {
            let message = `Error inesperado: no pudimos leer la compañía Contab seleccionada por el usuario.<br />
                           No se ha seleccionado una compañía antes de ejecutar este proceso?`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        const companiaSeleccionada = Companias.findOne(companiaSeleccionadaUsuario ? companiaSeleccionadaUsuario.companiaID : -999, { fields: { abreviatura: 1 }});

        // una copia del año fiscal a eliminar debe existir en mongo; de otra forma, regresamos un error 
        // para tener algo más de control, leemos la cantidad de records desde las tres tablas en mongo; 
        // si alguna no tuviera registros, fallamos con un error 

        const header = AsientosContables_respaldo_headers.findOne({ anoFiscal: anoFiscal, ciaContab: ciaContabID }); 

        if (!header) { 
            let message = `Error: aparentemente, los asientos contables que corresponden al año fiscal <b>${anoFiscal}</b>, 
                       que Ud. ha indicado, y para la compañía Contab seleccionada 
                       <b>(${companiaSeleccionada.abreviatura})</b>, no han sido respaldados aún. 
                       Ud. debe <b>primero</b> respaldar los asientos del año fiscal indicado, antes de intentar eliminarlos 
                       de la base de datos.  
                       `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }


        // ahora intentamos leer la cantidad de registros en cada tabla (asientos y partidas)
        const countAsientos = AsientosContables_respaldo_asientos.find({ headerId: header._id }).count(); 

        if (!countAsientos) { 
            let message = `Error: aparentemente, los asientos contables que corresponden al año fiscal <b>${anoFiscal}</b>, 
                       que Ud. ha indicado, y para la compañía Contab seleccionada 
                       <b>(${companiaSeleccionada.abreviatura})</b>, no han sido respaldados aún. 
                       Ud. debe <b>primero</b> respaldar los asientos del año fiscal indicado, antes de intentar eliminarlos 
                       de la base de datos.  
                       `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }


        const countPartidas = AsientosContables_respaldo_partidas.find({ headerId: header._id }).count(); 

        if (!countPartidas) { 
            let message = `Error: aparentemente, los asientos contables que corresponden al año fiscal <b>${anoFiscal}</b>, 
                       que Ud. ha indicado, y para la compañía Contab seleccionada 
                       <b>(${companiaSeleccionada.abreviatura})</b>, no han sido respaldados aún. 
                       Ud. debe <b>primero</b> respaldar los asientos del año fiscal indicado, antes de intentar eliminarlos 
                       de la base de datos.  
                       `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        // Ok, el respaldo, copia en mongo, parece adecuada; eliminamos los registros desde Sql 

        // NOTESE como leemos la cantidad de registros que vamos a eliminar (delete) antes de hacerlo. Aunque squelize 
        // debe permitir esto con 'destroy', mucha documentación existe que indica que no lo hace correctamente. Es 
        // por eso que decidimos hacerlo de esta forma (rudimentaria) aquí ... 

        // ------------------------------------------------------------------------------------------------------
        // 0) contamos las partidas antes de eliminarlas 
        let query = `Select Count(*) as contaPartidas 
                     From dAsientos d Inner Join Asientos a on d.NumeroAutomatico = a.NumeroAutomatico 
                     Where a.AnoFiscal = ? And a.Cia = ?`;

        let response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ anoFiscal, ciaContabID ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let countdAsientosSql = response.result[0].contaPartidas; 


        // ------------------------------------------------------------------------------------------------------
        // 1) contamos los asientos antes de eliminarlas 
        query = `Select Count(*) as contaAsientos From Asientos Where AnoFiscal = ? And Cia = ?`;

        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ anoFiscal, ciaContabID ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let countAsientosSql = response.result[0].contaAsientos; 


        // ------------------------------------------------------------------------------------------------------
        // 2) eliminamos las partidas (no debe ser necesario; al eliminar los asientos se deben eliminar en cascade delete)
        query = `Delete From dAsientos 
                 From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico 
                 Where a.AnoFiscal = ? And a.Cia = ?`;

        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ anoFiscal, ciaContabID ], type: sequelize.QueryTypes.DELETE })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // ------------------------------------------------------------------------------------------------------
        // 3) eliminamos los (finalmente) asientos contables 
        query = `Delete From Asientos Where AnoFiscal = ? And Cia = ?`;

        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ anoFiscal, ciaContabID ], type: sequelize.QueryTypes.DELETE })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }


        let message = `Ok, los asientos contables que corresponden al año fiscal <b>${anoFiscal}</b>, 
                       que Ud. ha indicado, y para la compañía Contab seleccionada <b>(${companiaSeleccionada.abreviatura})</b>, 
                       han sido eliminados de la base de datos. <br /> 
                       En total, se han eliminado <b>${countAsientosSql}</b> asientos y sus <b>${countdAsientosSql}</b> partidas. 
                       `; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: message, 
        }
    }
})