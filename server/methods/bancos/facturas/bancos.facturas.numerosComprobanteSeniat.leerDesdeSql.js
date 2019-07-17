

import moment from 'moment';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
    {
        'bancos.facturas.numerosComprobanteSeniat.leerDesdeSql': function (ciaContab) {

            new SimpleSchema({
                ciaContab: { type: SimpleSchema.Integer, optional: false, },
            }).validate({ ciaContab, });

            let query = `Select f.ClaveUnica as facturaID, f.numeroFactura as numeroFactura, f.NumeroControl as numeroControl, 
                         f.FechaEmision as fechaEmision, f.FechaRecepcion as fechaRecepcion, p.Abreviatura as proveedor, 
                         f.NcNdFlag as ncNd, f.MontoFacturaSinIva as montoNoImponible, f.MontoFacturaConIva as montoImponible, 
                         f.NumeroComprobante as numeroComprobante, f.NumeroOperacion as numeroOperacion 
                         From Facturas f Inner Join Proveedores p On f.Proveedor = p.Proveedor 
                         Where f.NumeroComprobante Is Not Null And 
                         f.Cia = ? 
                         Order By f.NumeroComprobante Desc, f.FechaRecepcion  
                         OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
            `;

            let response = null;
            response = Async.runSync(function (done) {
                sequelize.query(query, { replacements: [ciaContab,], type: sequelize.QueryTypes.SELECT })
                    .then(function (result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            let items = []; 

            for (const factura of response.result) {
                // ajustamos las fechas
                factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
                factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;

                items.push(factura); 
            }

            let message = `Ok, la cantidad de asientos contables por año fiscal, ha sido leída de forma satisfactoria.`;
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return {
                error: false,
                message: message,
                items: items
            };
        }
    })