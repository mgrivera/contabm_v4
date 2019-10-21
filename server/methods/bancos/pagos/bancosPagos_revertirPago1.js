

import { Meteor } from 'meteor/meteor'
import moment from 'moment'; 
import { TimeOffset } from '/globals/globals'; 
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

import { Pagos_sql } from '/server/imports/sqlModels/bancos/pagos'; 
import { ensureValueIsDate2 } from '/server/imports/general/generalFunctions'; 

Meteor.methods(
{
    bancosPagos_revertirPago1: function (claveUnicaPago) {

        new SimpleSchema({
            claveUnicaPago: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ claveUnicaPago, });

        let query = '';
        let response = null;

        // lo primero que vamos a hacer es leer el pago 
        response = null;
        response = Async.runSync(function(done) {
            Pagos_sql.findByPk(claveUnicaPago, { 
                attributes: [ "fecha", "cia", ]
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        const pago = response.result; 

        if (!pago) { 
            const message = `Error inesperado: no hemos podido leer el pago en la base de datos.<br />Por favor revise`; 
            return {
                error: true,
                message: message,
            }
        }

        // por alguna razón, sequelize v5 regresa dates como strings (???!!!) )
        pago.fecha = ensureValueIsDate2(pago.fecha); 

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        pago.fecha = pago.fecha ? moment(pago.fecha).add(TimeOffset, 'hours').toDate() : null;

        // la fecha del pago no debe corresponder a un mes cerrado en bancos 
        // si el pago es modificado, esta función valida *también* la fecha original del mismo

        const validarUMCBancos = validarUMC_Pago(pago.fecha, pago.cia);

        if (validarUMCBancos.error) {
            return {
                error: true,
                message: validarUMCBancos.message,
            }
        }


        // ------------------------------------------------------------------------------------------------------------
        // el pago debe tener registros en dPagos para poder ser revertido ...
        query = `Select Count(*) as contaPagos From dPagos Where ClaveUnicaPago = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ claveUnicaPago ],
                    type: sequelize.QueryTypes.SELECT,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (!response.result[0].contaPagos) {
            return {
                error: true,
                message: `El pago no tiene facturas asociadas.<br />
                          Un pago sin facturas asociadas no puede ser revertido.`,
            };
        }


        // ------------------------------------------------------------------------------------------------------------
        // leemos las facturas asociadas para validar si su fecha corresponde a un mes cerrado en bancos; 
        // nota: puede haber más de una factura asociada 

        query = `Select f.FechaEmision as fechaEmision, f.FechaRecepcion as fechaRecepcion, f.CxCCxPFlag as cxCCxPFlag, f.Cia as cia  
                 From dPagos d Left Outer Join CuotasFactura cf On d.ClaveUnicaCuotaFactura = cf.ClaveUnica 
                 Left Outer Join Facturas f On cf.ClaveUnicaFactura = f.ClaveUnica  
                 Where d.ClaveUnicaPago = ?
               `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ claveUnicaPago ],
                    type: sequelize.QueryTypes.SELECT,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        const facturas = response.result; 

        for (const factura of facturas) {

            // por alguna razón, sequelize v5 regresa dates como strings (???!!!) )
            factura.fechaEmision = ensureValueIsDate2(factura.fechaEmision);
            factura.fechaRecepcion = ensureValueIsDate2(factura.fechaRecepcion);

            // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
            factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
            factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;

            // nótese como la validación del UMC depende del tipo de compañía (prov o cliente)
            const validarUMCBancos = validarUMC_Facturas(factura.cxCCxPFlag,
                                                         factura.fechaEmision,
                                                         factura.fechaRecepcion,
                                                         factura.cia);

            if (validarUMCBancos.error) {
                return {
                    error: true,
                    message: validarUMCBancos.message,
                }
            }
        }
            


        // ------------------------------------------------------------------------------------------------------------
        // ahora revisamos si el pago tiene un movimiento bancario asociado. De ser así,
        // debemos informar al usuario
        query = `Select Count(*) as contaMovimientosBancarios From MovimientosBancarios Where PagoID = ?
                `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ claveUnicaPago ],
                    type: sequelize.QueryTypes.SELECT,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (response.result[0].contaMovimientosBancarios) {
            return {
                error: false,
                movimientoBancario: true,
                message: ``,
            };
        }

        return {
            error: false,
            message: ``,
        };
    }
})


function validarUMC_Pago (fecha, ciaContabID) {

    // arriba validamos las fechas 'originales' cuando el usuario modifica; ahora validamos las fechas indicadas
    // para la pago, al agregar o modificar
    let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fecha, ciaContabID);

    if (validarMesCerradoEnBancos.error) {
        // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
        let errorMessage = ` Error: la fecha del pago (${moment(fecha).format('DD-MM-YYYY')}) corresponde
                             a un mes ya cerrado en Bancos.`;
        return {
            error: true,
            message: errorMessage
        };
    }

    return {
        error: false
    };
}


function validarUMC_Facturas(cxCCxPFlag, fechaEmision, fechaRecepcion, ciaContabID) {

    if (cxCCxPFlag == 1) {
        // factura a proveedores; usamos la fecha de recepción
        let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fechaRecepcion, ciaContabID);

        if (validarMesCerradoEnBancos.error) {
            // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
            let errorMessage = ` Error: factura a proveedores; la fecha de recepción de la factura
                                    (${moment(fechaRecepcion).format('DD-MM-YYYY')}) corresponde
                                    a un mes ya cerrado en Bancos.
                                `;
            return {
                error: true,
                message: errorMessage
            };
        }
    }

    if (cxCCxPFlag == 2) {
        // factura a clientes; usamos la fecha de recepción
        let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fechaEmision, ciaContabID);

        if (validarMesCerradoEnBancos.error) {
            // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
            let errorMessage = ` Error: factura a clientes; la fecha de emisión de la factura
                                (${moment(fechaEmision).format('DD-MM-YYYY')}) corresponde
                                a un mes ya cerrado en Bancos.
                                `;
            return {
                error: true,
                message: errorMessage
            };
        }
    }

    return {
        error: false
    };
}
