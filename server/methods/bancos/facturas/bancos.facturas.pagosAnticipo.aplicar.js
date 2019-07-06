

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import numeral from 'numeral'; 

Meteor.methods(
{
    'bancos.facturas.pagosAnticipo.aplicar': function (pagoId, facturaId, montoAnticipo) {

        new SimpleSchema({
            pagoId: { type: SimpleSchema.Integer, optional: false, },
            facturaId: { type: SimpleSchema.Integer, optional: false, },
            montoAnticipo: { type: Number, optional: false }, 
        }).validate({ pagoId, facturaId, montoAnticipo, });

        // --------------------------------------------------------------------------------------------------------
        // leemos la 1ra cuota de la factura. Los pagos siempre afectan a una cuota en particular. En este caso de 
        // registro de pagos de anticipo, los aplicamos siempre a la 1ra cuota de la factura 
        let query = `Select Top 1 ClaveUnica as claveUnicaCuotaFactura 
                     From CuotasFactura 
                     Where ClaveUnicaFactura = ?
                     Order By ClaveUnicaCuotaFactura`;

        let response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ facturaId ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });


        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (response.result && Array.isArray(response.result) && !response.result.length) { 
            let message = `Error (inesperado): no hemos podido leer una cuota para la factura.<br /> 
                           Toda factura registrada en el sistema debe tener, al menos, una cuota asociada.<br /> 
                           Por favor revise.`; 
            message = message.replace(/\/\//g, '');     

            return { 
                error: true, 
                message: message, 
            }
        }

        const cuotaFacturaId = response.result[0].claveUnicaCuotaFactura; 

        // ahora ejecutamos la función que aplica el monto pagado a la factura 
        const result = aplicarPagoDeAnticipoAFactura(facturaId, pagoId, cuotaFacturaId, montoAnticipo); 

        return { 
            error: result.error, 
            message: result.message, 
        }
    }
})



function aplicarPagoDeAnticipoAFactura(facturaId, pagoId, cuotaFacturaId, montoAnticipo) { 

    // primero actualizamos el saldo y estado en la factura
    let query = `Update Facturas Set Saldo = Saldo - ${montoAnticipo},
                        Estado = (Case When (Saldo = ${montoAnticipo}) Then 3 Else 2 End)
                        Where ClaveUnica = ?
                        `;

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [ facturaId ],
                type: sequelize.QueryTypes.UPDATE,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    // ----------------------------------------------------------------------------------------
    // en forma idéntica, actualizamos la cuota de la factura
    query = `Update CuotasFactura Set SaldoCuota = SaldoCuota - ${montoAnticipo},
                    EstadoCuota = (Case When (SaldoCuota = ${montoAnticipo}) Then 3 Else 2 End)
                    Where ClaveUnica = ?
                `;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [ cuotaFacturaId ],
                type: sequelize.QueryTypes.UPDATE,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    // ----------------------------------------------------------------------------------------
    // agregamos un registro a dPagos para asociar la factura (en realidad la cuota) y el pago 
    query = `Insert Into dPagos(ClaveUnicaPago, ClaveUnicaCuotaFactura, MontoPagado) Values(?, ?, ?)`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [ pagoId, cuotaFacturaId, montoAnticipo, ],
                type: sequelize.QueryTypes.INSERT,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    return {
        error: false,
        message: `Ok, el pago de anticipo ha sido aplicado en forma satisfactoria.<br />
                  El monto total del pago efectuado es <b>${numeral(montoAnticipo).format('0,0.00')}</b></b>.
                  Ud. podrá ver cómo se ha afectado la factura, si cierra este diálogo y hace un <em>Refresh</em> a la misma. 
                  `,
    }
}