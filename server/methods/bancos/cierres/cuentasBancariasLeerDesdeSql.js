

import { Meteor } from 'meteor/meteor'

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
    {
        'cuentasBancariasLeerDesdeSql_1raPagina': async function (search, pagina, ciaContabSeleccionadaID) {

            // con este método leemos la 1ra página, cuando el usuario indica un filtro; siempre regresamos 1 página 

            new SimpleSchema({
                search: { type: String, optional: true, },
                pagina: { type: SimpleSchema.Integer, optional: false, },
                ciaContabSeleccionadaID: { type: SimpleSchema.Integer, optional: false, },
            }).validate({ search, pagina, ciaContabSeleccionadaID });

            const offset = (pagina - 1) * 25;       
            const whereAno = search && !Number.isNaN(search) ? `(s.Ano = ${search})` : "(1 = 1)"

            const query1 = `Select Count(*) as itemsCount  
                            From Saldos s Inner Join CuentasBancarias cb on s.CuentaBancaria = cb.CuentaInterna 
                            Where cb.Cia = ? And ${whereAno} 
                            `;

            let recordCount = null; 

            try { 
                recordCount = await sequelize.query(query1, { 
                    replacements: [ ciaContabSeleccionadaID, ], 
                    type: sequelize.QueryTypes.SELECT }); 

            } catch(error) { 
                throw new Meteor.Error(error && error.message ? error.message : error.toString());
            }

            const itemsCount = recordCount[0].itemsCount; 

            // ---------------------------------------------------------------------------------------------------------------
            // leímos la cantidad total de registros para el query; ahora leemos los primeros 25 
            // nótese el fetchNext: si el usurio quiere todo, resto, no ponemos nada; de otra forma, regresamos 1 pagina (25 rows)
            const query2 = `Select cb.CuentaBancaria as cuentaBancaria, cb.Tipo as tipo, m.Simbolo as simboloMoneda, 
                    s.Ano as ano, 
                    s.Inicial as inicial, s.Mes01 as mes01, s.Mes02 as mes02, s.Mes03 as mes03,  
                    s.Mes04 as mes04, s.Mes05 as mes05, s.Mes06 as mes06,  
                    s.Mes07 as mes07, s.Mes08 as mes08, s.Mes09 as mes09,  
                    s.Mes10 as mes10, s.Mes11 as mes11, s.Mes12 as mes12, 
                    co.Abreviatura as abreviaturaCompania 
                    From Saldos s Inner Join CuentasBancarias cb on s.CuentaBancaria = cb.CuentaInterna 
                    Inner Join Monedas m On cb.Moneda = m.Moneda 
                    Inner Join Companias co On cb.Cia = co.Numero 
                    Where co.Numero = ? And ${whereAno}  
                    Order By s.Ano, cb.CuentaBancaria    
                    OFFSET ? ROWS FETCH NEXT 25 ROWS ONLY
                    `;

            let cuentasBancarias = null; 

            try { 
                cuentasBancarias = await sequelize.query(query2, { 
                                    replacements: [ ciaContabSeleccionadaID, offset, ], 
                                    type: sequelize.QueryTypes.SELECT })
            } catch(error) { 
                throw new Meteor.Error(error && error.message ? error.message : error.toString());
            }
                
            let items = []; 

            for (const item of cuentasBancarias) {
                items.push(item); 
            }

            const message = `Ok, <b>${items.length.toString()}</b> registros (de <b>${itemsCount.toString()}</b>) han sido leídos desde la base de datos.`;

            return {
                error: false,
                message: message,
                items: items, 
                itemsCount: itemsCount, 
            };
        }, 


        'cuentasBancariasLeerDesdeSql_pagina_resto': async function (search, pagina, ciaContabSeleccionadaID, tipoOpcion, itemsCount) {

            // con este método podemos regresar 1 página o el resto; el usuario puede hacer click en más/todo 

            new SimpleSchema({
                search: { type: String, optional: true, },
                pagina: { type: SimpleSchema.Integer, optional: false, },
                ciaContabSeleccionadaID: { type: SimpleSchema.Integer, optional: false, },
                tipoOpcion: { type: String, optional: false, },
                itemsCount: { type: SimpleSchema.Integer, optional: false, },
            }).validate({ search, pagina, ciaContabSeleccionadaID, tipoOpcion, itemsCount, });

            // tipoOpcion: mas/todo. El usuario puede pedir otra página o todos los registros que quedan por leer. 

            const offset = (pagina - 1) * 25; 

            // tipoOpcion: todo: no usamos el 'fetch next', para leer todos los que quedan 
            const fetchNext = tipoOpcion == "mas" ? "FETCH NEXT 25 ROWS ONLY" : "";        
            const whereAno = search && !Number.isNaN(search) ? `(s.Ano = ${search})` : "(1 = 1)"

            // leímos la cantidad total de registros para el query; ahora leemos los primeros 25 
            // nótese el fetchNext: si el usurio quiere todo, resto, no ponemos nada; de otra forma, regresamos 1 pagina (25 rows)
            const query = `Select cb.CuentaBancaria as cuentaBancaria, cb.Tipo as tipo, m.Simbolo as simboloMoneda, 
                            s.Ano as ano, 
                            s.Inicial as inicial, s.Mes01 as mes01, s.Mes02 as mes02, s.Mes03 as mes03,  
                            s.Mes04 as mes04, s.Mes05 as mes05, s.Mes06 as mes06,  
                            s.Mes07 as mes07, s.Mes08 as mes08, s.Mes09 as mes09,  
                            s.Mes10 as mes10, s.Mes11 as mes11, s.Mes12 as mes12, 
                            co.Abreviatura as abreviaturaCompania 
                            From Saldos s Inner Join CuentasBancarias cb on s.CuentaBancaria = cb.CuentaInterna 
                            Inner Join Monedas m On cb.Moneda = m.Moneda 
                            Inner Join Companias co On cb.Cia = co.Numero 
                            Where co.Numero = ? And ${whereAno}  
                            Order By s.Ano, cb.CuentaBancaria    
                            OFFSET ? ROWS ${fetchNext}
                            `;

            let cuentasBancarias = null; 

            try { 
                cuentasBancarias = await sequelize.query(query, { 
                    replacements: [ ciaContabSeleccionadaID, offset, ], 
                    type: sequelize.QueryTypes.SELECT }); 
            } catch(error) { 
                throw new Meteor.Error(error && error.message ? error.message : error.toString());
            }
                
            let items = []; 

            for (const item of cuentasBancarias) {
                items.push(item); 
            }

            const message = `Ok, <b>${items.length.toString()}</b> registros (de <b>${itemsCount.toString()}</b>) han sido leídos desde la base de datos.`;

            return {
                error: false,
                message: message,
                items: items, 
            };
        }
    })