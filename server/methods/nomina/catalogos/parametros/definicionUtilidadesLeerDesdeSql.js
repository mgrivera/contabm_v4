

import { Meteor } from 'meteor/meteor'
import moment from 'moment';

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

import { tGruposEmpleados_sql } from '/server/imports/sqlModels/nomina/catalogos/gruposEmpleados'; 
import { TimeOffset } from '/globals/globals'; 

// para usar los operators en sequelize 
import Sequelize from 'sequelize';
const Op = Sequelize.Op

Meteor.methods(
    {
        'nominaParametrosDefinicionUtilidadesLeerDesdeSql_1raPagina': async function (pagina, ciaContabSeleccionadaID) {

            // con este método leemos la 1ra página, cuando el usuario indica un filtro; siempre regresamos 1 página 

            new SimpleSchema({
                pagina: { type: SimpleSchema.Integer, optional: false, },
                ciaContabSeleccionadaID: { type: SimpleSchema.Integer, optional: false, },
            }).validate({ pagina, ciaContabSeleccionadaID });

            const offset = (pagina - 1) * 25;       

            // nótese como en casos como éste, catálogos, etc., leemos todos los registros (ie: no usamos un search) 
            const query1 = `Select Count(*) as itemsCount  
                            From Utilidades u Inner Join tGruposEmpleados g on u.GrupoNomina = g.Grupo 
                            Where g.Cia = ? 
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
            const query2 = `Select u.ID as id, u.GrupoNomina as grupoNomina, u.FechaNomina as fechaNomina, 
                            u.Desde as desde, u.Hasta as hasta, u.CantidadMesesPeriodoPago as cantidadMesesPeriodoPago, 
                            u.CantidadDiasPeriodoPago as cantidadDiasPeriodoPago, u.CantidadDiasUtilidades as cantidadDiasUtilidades, 
                            u.BaseAplicacion as baseAplicacion, u.AplicarInce as aplicarInce, u.IncePorc as incePorc, 
                            c.Abreviatura as abreviaturaCompania
                            From Utilidades u Inner Join tGruposEmpleados g on u.GrupoNomina = g.Grupo 
                            Inner Join Companias c on g.Cia = c.Numero 
                            Where g.Cia = ? 
                            Order By u.FechaNomina Desc 
                            OFFSET ? ROWS FETCH NEXT 25 ROWS ONLY
                            `;

            let utilidades = null; 

            try { 
                utilidades = await sequelize.query(query2, { 
                                    replacements: [ ciaContabSeleccionadaID, offset, ], 
                                    type: sequelize.QueryTypes.SELECT })
            } catch(error) { 
                throw new Meteor.Error(error && error.message ? error.message : error.toString());
            }
                
            const items = []; 

            for (const item of utilidades) {
                // ajustamos las fechas 
                item.fechaNomina = item.fechaNomina ? moment(item.fechaNomina).add(TimeOffset, 'hours').toDate() : null;
                item.desde = item.desde ? moment(item.desde).add(TimeOffset, 'hours').toDate() : null;
                item.hasta = item.hasta ? moment(item.hasta).add(TimeOffset, 'hours').toDate() : null;

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


        'nominaParametrosDefinicionUtilidadesLeerDesdeSql_pagina_resto': async function (pagina, ciaContabSeleccionadaID, tipoOpcion, itemsCount) {

            // con este método podemos regresar 1 página o el resto; el usuario puede hacer click en más/todo 

            new SimpleSchema({
                pagina: { type: SimpleSchema.Integer, optional: false, },
                ciaContabSeleccionadaID: { type: SimpleSchema.Integer, optional: false, },
                tipoOpcion: { type: String, optional: false, },
                itemsCount: { type: SimpleSchema.Integer, optional: false, },
            }).validate({ pagina, ciaContabSeleccionadaID, tipoOpcion, itemsCount, });

            // tipoOpcion: mas/todo. El usuario puede pedir otra página o todos los registros que quedan por leer. 

            const offset = (pagina - 1) * 25; 

            // tipoOpcion: todo: *no* usamos el 'fetch next', si el usuario quiere leer todos los que quedan 
            const fetchNext = tipoOpcion == "mas" ? "FETCH NEXT 25 ROWS ONLY" : "";        

            // leímos la cantidad total de registros para el query; ahora leemos los primeros 25 
            // nótese el fetchNext: si el usurio quiere todo, resto, no ponemos nada; de otra forma, regresamos 1 pagina (25 rows)
            const query = `Select u.ID as id, u.GrupoNomina as grupoNomina, u.FechaNomina as fechaNomina, 
                            u.Desde as desde, u.Hasta as hasta, u.CantidadMesesPeriodoPago as cantidadMesesPeriodoPago, 
                            u.CantidadDiasPeriodoPago as cantidadDiasPeriodoPago, u.CantidadDiasUtilidades as cantidadDiasUtilidades, 
                            u.BaseAplicacion as baseAplicacion, u.AplicarInce as aplicarInce, u.IncePorc as incePorc, 
                            c.Abreviatura as abreviaturaCompania
                            From Utilidades u Inner Join tGruposEmpleados g on u.GrupoNomina = g.Grupo 
                            Inner Join Companias c on g.Cia = c.Numero 
                            Where g.Cia = ? 
                            Order By u.FechaNomina Desc 
                            OFFSET ? ROWS ${fetchNext}
                            `;

            let utilidades = null; 

            try { 
                utilidades = await sequelize.query(query, { 
                    replacements: [ ciaContabSeleccionadaID, offset, ], 
                    type: sequelize.QueryTypes.SELECT }); 
            } catch(error) { 
                throw new Meteor.Error(error && error.message ? error.message : error.toString());
            }
                
            const items = []; 

            for (const item of utilidades) {
                // ajustamos las fechas 
                item.fechaNomina = item.fechaNomina ? moment(item.fechaNomina).add(TimeOffset, 'hours').toDate() : null;
                item.desde = item.desde ? moment(item.desde).add(TimeOffset, 'hours').toDate() : null;
                item.hasta = item.hasta ? moment(item.hasta).add(TimeOffset, 'hours').toDate() : null;
                
                items.push(item); 
            }

            const message = `Ok, <b>${items.length.toString()}</b> registros (de <b>${itemsCount.toString()}</b>) han sido leídos desde la base de datos.`;

            return {
                error: false,
                message: message,
                items: items, 
            };
        }, 


        'nominaParametrosDefinicionUtilidades_leerDatosRelacionados': async function (ciaContabSeleccionadaID) {

            // para leer info relacionada, como catálogos, al proceso que se está ejecutando 
            // normalmente, estos datos deben ser leídos al iniciarse el proceso para ser usados durante 
            // la ejecución del mismo ... 

            new SimpleSchema({
                ciaContabSeleccionadaID: { type: SimpleSchema.Integer, optional: false, },
            }).validate({ ciaContabSeleccionadaID });   
            
            let gruposNomina = []; 

            try { 
                gruposNomina = await tGruposEmpleados_sql.findAll({  
                    where: { 
                        [Op.and]: [
                            { 'grupoNominaFlag': { [Op.eq]: 1 }},       
                            { 'cia': { [Op.eq]: ciaContabSeleccionadaID }}       
                        ]
                    }, 
                    attributes: [ 'grupo', 'nombreGrupo', 'descripcion', ], 
                    raw: true,          // para no agregar metadata al result; solo el array con los records 
                }); 

            } catch(error) { 
                throw new Meteor.Error(error && error.message ? error.message : error.toString());
            }

            const message = ""; 

            return {
                error: false,
                message: message,
                gruposNomina: gruposNomina, 
            };
        }, 
    })