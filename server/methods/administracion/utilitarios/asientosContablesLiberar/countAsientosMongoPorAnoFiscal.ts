

import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema';
import * as moment from 'moment'; 

import { Companias } from 'imports/collections/companias';
import { CompaniaSeleccionada } from 'imports/collections/companiaSeleccionada';
import { AsientosContables_respaldo_headers } from "imports/collections/contab/asientosContables_respaldo";
import { AsientosContables_respaldo_asientos } from "imports/collections/contab/asientosContables_respaldo";
import { AsientosContables_respaldo_partidas } from "imports/collections/contab/asientosContables_respaldo";

Meteor.methods(
{
    countAsientosMongoPorAnoFiscal: function (ciaContabID) {

        new SimpleSchema({
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ ciaContabID, });

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

        // 1) leemos los items en ...headers, ordenados por año fiscal 
        const headers = AsientosContables_respaldo_headers.find({ ciaContab: ciaContabID }, { sort: { anoFiscal: 1, fecha: 1, }}).fetch(); 

        // para cada row leído, leemos la cantidad de asientos y la cantidad de partidas; 
        // regresamos estos datos para mostrarlos al usuario 
        let respaldoArray: {}[] = []; 

        for (let header of headers) { 

            const countAsientos = AsientosContables_respaldo_asientos.find({ headerId: header._id }).count(); 
            const countPartidas = AsientosContables_respaldo_partidas.find({ headerId: header._id }).count(); 

            respaldoArray.push({ 
                headerId: header._id, 
                anoFiscal: header.anoFiscal, 
                fecha: header.fecha ? moment(header.fecha).format("YYYY-MMM-DD H:m a") : "invalid", 
                countAsientos: countAsientos, 
                countPartidas: countPartidas, 
                cia: ciaContabID, 
                nombreCia: companiaSeleccionada.abreviatura
            })
        }

        let message = `Ok, la cantidad de asientos contables por año fiscal, ha sido leída de forma satisfactoria.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: message, 
            items: respaldoArray
        }; 
    }
})