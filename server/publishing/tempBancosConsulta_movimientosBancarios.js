

import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema';
import { Temp_Consulta_Bancos_MovimientosBancarios } from '/imports/collections/temp/tempConsultaMovimientosBancarios'; 

Meteor.publish("temp.Bancos.Consulta.movimientosBancarios", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    new SimpleSchema({
        cantRecords: { type: Number }
      }).validate({ cantRecords });

    const options = {
        sort: { fecha: 1, transaccion: 1 },
        limit: cantRecords,
    };

    return Temp_Consulta_Bancos_MovimientosBancarios.find(
        { user: this.userId },
        options
    );
})
