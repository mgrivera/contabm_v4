

import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Match } from 'meteor/check'
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

import { Proveedores_sql } from '/server/imports/sqlModels/bancos/proveedores'; 

Meteor.methods(
{
    "bancos.movBanc.leerInfo.exportarTxt": async function (chequeraID, proveedorID)
    {
        check(chequeraID, Match.Integer);
        check(proveedorID, Match.Integer);

        // --------------------------------------------------------------------------------------------------
        // primero leemos los datos que corresponden a la cuenta bancaria (moneda, cuenta, banco, ...)
        const select = `Select cb.CuentaBancaria as cuentaBancaria, 
                        m.Moneda as moneda, m.Descripcion as monedaDescripcion, m.Simbolo as monedaSimbolo, 
                        bc.Banco as banco, bc.Nombre as bancoNombre, bc.NombreCorto as bancoNombreCorto, 
                        bc.Abreviatura as bancoAbreviatura 
                        
                        From Chequeras ch Inner Join CuentasBancarias cb On ch.NumeroCuenta = cb.CuentaInterna 
                        Inner Join Monedas m On cb.Moneda = m.Moneda 
                        Inner Join Agencias ag On cb.Agencia = ag.Agencia 
                        Inner Join Bancos bc On ag.Banco = bc.Banco 
                        
                        Where ch.NumeroChequera = ? 
                        `;

        let query = null; 

        try { 
            query = await sequelize.query(select, { 
                replacements: [ chequeraID, ], 
                type: sequelize.QueryTypes.SELECT }); 

        } catch(error) { 
            throw new Meteor.Error(error && error.message ? error.message : error.toString());
        }

        const cuentaBancariaInfo = query[0]; 

        // --------------------------------------------------------------------------------------------------
        // ahora leemos los datos de la compañía 
        let proveedorInfo = null; 

        try { 
            proveedorInfo = await Proveedores_sql.findByPk(proveedorID, { 
                attributes: [ 'proveedor', 'nombre', 'abreviatura', ], 
            });
        } catch(error) { 
            throw new Meteor.Error(error && error.message ? error.message : error.toString());
        }

        const message = `Ok, los datos de la cuenta bancaria fueron leídos en forma correcta.`;

        return {
            error: false,
            message: message,
            cuentaBancariaInfo: cuentaBancariaInfo, 
            proveedorInfo: proveedorInfo.dataValues, 
        };
    }
})