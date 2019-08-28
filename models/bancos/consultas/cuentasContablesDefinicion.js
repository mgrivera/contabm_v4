
// DefinicionCuentasContables
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// definimos un schema para validar al grabar; no lo asociamos al collection, sin embargo, pues éste 
// no corresponde a uno permanente ... 
export const CuentasContables_Definicion_Schema = new SimpleSchema({
    _id: { type: String, optional: false },

    claveUnica: { type: Number, label: "ID", optional: false, },
    rubro: { type: Number, label: "Rubro", optional: true, },
    compania: { type: Number, label: "Compañía (id)", optional: true, },
    nombreCompania: { type: String, label: "Compañía", optional: true, },
    moneda: { type: Number, label: "Moneda", optional: true, },
    concepto: { type: Number, label: "Concepto", optional: false, },
    concepto2: { type: Number, label: "Concepto2", optional: true, },
    cuentaContableID: { type: Number, label: "Cuenta contable (id)", optional: false, },
    descripcionCuentaContable: { type: String, label: "Cuenta contable", optional: true, },

    user: { type: String, label: 'Mongo user', optional: false, },
    docState: { type: Number, optional: true, }
});

Temp_Consulta_Bancos_CuentasContables_Definicion = new Mongo.Collection("temp_consulta_bancos_cuentasContables_definicion");
