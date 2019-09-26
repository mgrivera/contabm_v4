

import { Temp_Consulta_SaldosContables } from '/imports/collections/contab/consultas/tempConsultaSaldosContables'; 
Meteor.publish("tempConsulta_saldosContables", function () {

    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario
    return Temp_Consulta_SaldosContables.find({ user: this.userId });
})
