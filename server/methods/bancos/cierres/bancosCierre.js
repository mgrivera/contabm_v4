

import { Meteor } from 'meteor/meteor'
import { Match } from 'meteor/check'
import { Async } from 'meteor/meteorhacks:async';

import moment from 'moment';
import numeral from 'numeral';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import { TimeOffset } from '/globals/globals'; 
import { UltimoMesCerrado_sql } from "/server/imports/sqlModels/bancos/ultimoMesCerrado"; 

Meteor.methods(
{
    bancosCierre: function (mesesArray, ano, ciaContab) {

        Match.test(mesesArray, Match.Array);
        Match.test(ano, Match.Integer);
        Match.test(ciaContab, Match.Object);

        // nota: mesACerrar es un array que puede tener más de un mes a cerrar (ej: [ 01, 02, 03, 04, ...])
        mesesArray.forEach((mes) => {

            // primero cerramos las cuentas bancarias (movimientos bancarios); luego las compañías (facturas y pagos)

            // determinamos las fechas inicial y final del mes, para leer los movimientos bancarios
            let primerDiaMes = new Date(ano, mes -1, 1);
            let ultimoDiaMes = new Date(ano, mes -1 + 1, 0);        // js: last day of month ...

            // PRIMERO cerramos las cuentas bancarias; leemos cada cuenta bancaria; para cada cuenta bancaria,
            // leemos su registro de saldos y los movimientos que se han registrado en el mes; con ésto,
            // determinamos y registramos el nuevo saldo (del mes) ...

            let query = `Select c.CuentaInterna As cuentaInterna From CuentasBancarias c Where c.Cia = ?`;

            let response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ ciaContab.numero ], type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            let numberOfItems = response.result.length;
            let reportarCada = Math.floor(numberOfItems / 25);
            let reportar = 0;
            let cantidadRecs = 0;
            let numberOfProcess = 3;
            let currentProcess = 1;

            // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
            let eventName = "bancos_cierreBancos_reportProgress";
            let eventSelector = { myuserId: this.userId, app: 'bancos', process: 'cierreBancos' };
            let eventData = {
                              current: currentProcess, 
                              max: numberOfProcess, 
                              progress: '0 %',
                              message: `Cerrando el mes ${nombreMes(mes)} ... `
                            };

            // sync call
            Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            // -------------------------------------------------------------------------------------------------------------

            response.result.forEach((cuentaBancaria) => {

                // leemos el registro de saldos para la cuenta y el año del cierre; puede no existir ...
                query = `Select * From Saldos Where CuentaBancaria = ? And Ano = ?`;

                response = null;
                response = Async.runSync(function(done) {
                    sequelize.query(query, {
                                              replacements: [ cuentaBancaria.cuentaInterna, ano ],
                                              type: sequelize.QueryTypes.SELECT
                                           })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }

                let saldos = Array.isArray(response.result) && response.result.length ? response.result[0] : null;

                if (saldos) {
                    // hay un registro de saldos; pasamos el saldo anterior al saldo actual
                    query = `Update Saldos Set ${mesTablaSaldos(mes)} = ${mesTablaSaldos(mes -1)} Where ID = ?`;

                    response = null;
                    response = Async.runSync(function(done) {
                        sequelize.query(query, { replacements: [ saldos.ID ], type: sequelize.QueryTypes.UPDATE })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });

                    if (response.error) { 
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }
                }
                else {
                    // la cuenta bancaria no tiene un registro de saldos para el año del cierre; lo agregamos
                    query = `Insert Into Saldos (CuentaBancaria, Ano, Inicial, Mes01, Mes02, Mes03, Mes04, Mes05, Mes06,
                                 Mes07, Mes08, Mes09, Mes10, Mes11, Mes12)
                                 Values (?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`;

                    response = null;
                    response = Async.runSync(function(done) {
                        sequelize.query(query, {
                                                 replacements: [ cuentaBancaria.cuentaInterna, ano ],
                                                 type: sequelize.QueryTypes.INSERT
                                               })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });

                    if (response.error) { 
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }
                }

                // ----------------------------------------------------------------------------------------
                // arriba nos aseguramos que exista un registro de saldos; si existe, ponemos el saldo anterior en 
                // el saldo del mes; si no existe, creamos un registro de saldos, con todos sus saldos en cero. 

                // ahora leemos los movimientos bancarios para la cuenta y el mes; la idea es actualizar el saldo del mes
                // con el saldo anterior, que ya está en el saldo actual, y el movimiento (bancario) del mes 
                query = `Select Sum(Monto) As monto, Count(*) as count 
                            From MovimientosBancarios m Inner Join Chequeras c On m.ClaveUnicaChequera = c.NumeroChequera
                            Where c.NumeroCuenta = ? And m.Fecha Between ? And ?`;

                response = null;
                response = Async.runSync(function(done) {
                    sequelize.query(query, {
                        replacements: [ cuentaBancaria.cuentaInterna,
                                        moment(primerDiaMes).format("YYYY-MM-DD"),
                                        moment(ultimoDiaMes).format("YYYY-MM-DD") ],
                        type: sequelize.QueryTypes.SELECT
                    })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }

                if (Array.isArray(response.result) && response.result.length) {
                    // TODO: actualizamos el saldo, para agregar el monto en movimientos bancarios
                    let monto = response.result[0].monto;
                    let count = response.result[0].count;

                    if (count > 0) {
                        query = `Update Saldos Set ${mesTablaSaldos(mes)} = (${mesTablaSaldos(mes)} + ?) Where ID = ?`;

                        response = null;
                        response = Async.runSync(function(done) {
                            sequelize.query(query, {
                                                      replacements: [ monto.toString(), saldos.ID ],
                                                      type: sequelize.QueryTypes.UPDATE
                                                  })
                                .then(function(result) { done(null, result); })
                                .catch(function (err) { done(err, null); })
                                .done();
                        });

                        if (response.error) { 
                            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                        }
                    }
                }

                // -------------------------------------------------------------------------------------------------------
                // vamos a reportar progreso al cliente; solo 20 veces ...
                cantidadRecs++;

                if (numberOfItems <= 25) {
                    // hay menos de 20 registros; reportamos siempre ...
                    eventData = { current: currentProcess, 
                                  max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `Cerrando el mes ${nombreMes(mes)} ... `
                                };
                    Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                }
                else {
                    reportar++;
                    if (reportar === reportarCada) {
                        eventData = { current: currentProcess, 
                                      max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: `Cerrando el mes ${nombreMes(mes)} ... `
                                    };
                        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                        reportar = 0;
                    }
                }
            })

            // ---------------------------------------------------------------------------------------------------------
            // creamos 4 arrays con montos sumarizados de facturas y pagos. En general, las facturas pueden ser de 
            // proveedores (pagos - en contra) o clientes (cobros - a favor); los pagos, en forma similar: 'mi' en 
            // contra y 'su' a favor ... 

            const facturasClientes = leerYSumarizarFacturasClientes(primerDiaMes, ultimoDiaMes, ciaContab.numero); 
            const facturasProveedores = leerYSumarizarFacturasProveedores(primerDiaMes, ultimoDiaMes, ciaContab.numero); 

            const misPagos = leerYSumarizarMisPagos(primerDiaMes, ultimoDiaMes, ciaContab.numero); 
            const susPagos = leerYSumarizarSusPagos(primerDiaMes, ultimoDiaMes, ciaContab.numero); 

            // ---------------------------------------------------------------------------------------------
            // arriba hicimos el cierre de cuentas bancarias; ahora efectuamos el cierre de compañías ...

            // leemos cada moneda
            query = `Select Moneda As moneda, Descripcion as descripcion From Monedas`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, {
                                          replacements: [ ],
                                          type: sequelize.QueryTypes.SELECT
                                      })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            for (const moneda of response.result) {
                // leer compañías (Proveedores) para cada moneda

                query = `Select Proveedor As compania From Proveedores`;

                response = null;
                response = Async.runSync(function(done) {
                    sequelize.query(query, {
                                              replacements: [ ],
                                              type: sequelize.QueryTypes.SELECT
                                          })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }

                // -------------------------------------------------------------------------------------------------------------
                // valores para reportar el progreso
                numberOfItems = response.result.length;
                reportarCada = Math.floor(numberOfItems / 25);
                reportar = 0;
                cantidadRecs = 0;
                currentProcess = 2;

                eventData = { current: currentProcess, 
                              max: numberOfProcess,
                              progress: '0 %',
                              message: `Cerrando el mes ${nombreMes(mes)} / ${moneda.descripcion}... `
                            };
                Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

                for (const compania of response.result) {

                    let movimientoDelPeriodo = 0;

                    // -----------------------------------------------------------------------------------------
                    // leemos las facturas para la compañía,  del tipo CxC; a nuestro favor
                    // usar ésto para leer moneda.moneda, compania.compania,
                    const facturaClientes = facturasClientes.find(x => x.proveedor === compania.compania && x.moneda === moneda.moneda); 
 
                    if (facturaClientes) { 
                        movimientoDelPeriodo += facturaClientes.monto;
                    }
                        

                    // -----------------------------------------------------------------------------------------
                    // leemos las facturas para la compañía,  del tipo CxP; en contra
                    const facturaProveedores = facturasProveedores.find(x => x.proveedor === compania.compania && x.moneda === moneda.moneda); 
                    
                    if (facturaProveedores) { 
                        movimientoDelPeriodo -= facturaProveedores.monto;
                    }
                        
                    // -----------------------------------------------------------------------------------------
                    // leemos los pagos que hemos recibido de clientes; a nuestro favor
                    const suPago = susPagos.find(x => x.proveedor === compania.compania && x.moneda === moneda.moneda);

                    if (suPago) { 
                        movimientoDelPeriodo += suPago.monto;
                    }

                    // -----------------------------------------------------------------------------------------
                    // leemos los pagos que hemos hecho a proveedores; en contra
                    const miPago = misPagos.find(x => x.proveedor === compania.compania && x.moneda === moneda.moneda);

                    if (miPago) { 
                        movimientoDelPeriodo -= miPago.monto;
                    }

                    // Finalmente, actualizamos el saldo de la compañia
                    // -----------------------------------------------------------------------------------------

                    // 1) leemos el saldo (puede no existir)
                    query = `Select * From SaldosCompanias Where Moneda = ? And Compania = ? And Ano = ? And Cia = ?`;

                    response = null;
                    response = Async.runSync(function(done) {
                        sequelize.query(query, { replacements: [ moneda.moneda,
                                                                  compania.compania,
                                                                  ano,
                                                                  ciaContab.numero
                                                                ],
                                                  type: sequelize.QueryTypes.SELECT
                                              })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });

                    if (response.error) { 
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }

                    const saldoCompania = response.result[0];

                    if (!saldoCompania) {
                        // 2) el registro de saldos no existe; lo agregamos
                        query = `Insert Into SaldosCompanias (Moneda, Compania, Ano, Cia) Values (?, ?, ?, ?)`;

                        response = null;
                        response = Async.runSync(function(done) {
                            sequelize.query(query, {
                                                      replacements: [
                                                                      moneda.moneda,
                                                                      compania.compania,
                                                                      ano,
                                                                      ciaContab.numero
                                                                  ],
                                                      type: sequelize.QueryTypes.INSERT
                                                  })
                                .then(function(result) { done(null, result); })
                                .catch(function (err) { done(err, null); })
                                .done();
                        });

                        if (response.error) { 
                            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                        }
                    }

                    // 4) finalmente, ahora que sabemos que el registro de saldos *existe* lo actualizamos ...
                    query = `Update SaldosCompanias Set ${mesTablaSaldos(mes)} = ? Where Moneda = ? And Compania = ? And Ano = ? And Cia = ?`;

                    response = null;
                    response = Async.runSync(function(done) {
                        sequelize.query(query, {
                                                  replacements: [ movimientoDelPeriodo,
                                                                  moneda.moneda,
                                                                  compania.compania,
                                                                  ano,
                                                                  ciaContab.numero
                                                                ],
                                                  type: sequelize.QueryTypes.UPDATE
                                              })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });

                    if (response.error) { 
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }

                    // -------------------------------------------------------------------------------------------------------
                    // vamos a reportar progreso al cliente; solo 20 veces ...
                    cantidadRecs++;
                    if (numberOfItems <= 25) {
                        // hay menos de 20 registros; reportamos siempre ...
                        eventData = { current: currentProcess, 
                                      max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: `Cerrando el mes ${nombreMes(mes)} / ${moneda.descripcion}... `
                                    };
                        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    }
                    else {
                        reportar++;
                        if (reportar === reportarCada) {
                            eventData = { current: currentProcess, 
                                          max: numberOfProcess,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                          message: `Cerrando el mes ${nombreMes(mes)} / ${moneda.descripcion}... `
                                        };
                            Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                            reportar = 0;
                        }
                    }
                }
            }


            // ---------------------------------------------------------------------------------------------
            // actualizamos el ultimo mes cerrado ...

            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            numberOfItems = 1;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess = 3;

            eventData = {
                          current: currentProcess, max: numberOfProcess,
                          progress: '0 %',
                          message: `Cerrando el mes ${nombreMes(mes)} ... `
                        };
            Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

            response = {};
            let filter = { cia: ciaContab.numero };

            let ultimoMesCerrado = {
                mes: mes,
                ano: ano,
                ultAct: new Date(),
                manAuto: "A",
                cia: ciaContab.numero,
                usuario: Meteor.user().emails[0].address,
            };

            // al actualizar (insert/update), sequelize grobaliza las fechas; revertimos ...
            ultimoMesCerrado.ultAct = moment(ultimoMesCerrado.ultAct).subtract(TimeOffset, 'h').toDate();

            response = Async.runSync(function(done) {
                UltimoMesCerrado_sql.update(ultimoMesCerrado, { where: filter })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            eventData = {
                          current: currentProcess, max: numberOfProcess,
                          progress: '100 %',
                          message: `Cerrando el mes ${nombreMes(mes)} ... `
                        };
            Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        });

        let finalMessage = "";

        if (mesesArray.length == 1) { 
            finalMessage = `Ok, el cierre en <em>Bancos</em> del mes <b><em>${nombreMes(mesesArray[0])}</em></b>,
                            se ha ejecutado en forma satisfactoria.`;
        }
        else { 
            finalMessage = `Ok, el cierre en <em>Bancos</em> de los meses <b><em>${nombreMes(mesesArray[0])}</em></b> a
                        <b><em>${nombreMes(mesesArray[mesesArray.length - 1])}</em></b>,
                        se ha ejecutado en forma satisfactoria.`;
        }
        
        return finalMessage;
    }
})


function nombreMes(mes) {

    switch (mes) {
        case 0:
            return 'Ninguno';
        case 1:
            return 'Enero';
        case 2:
            return 'Febrero';
        case 3:
            return 'Marzo';
        case 4:
            return 'Abril';
        case 5:
            return 'Mayo';
        case 6:
            return 'Junio';
        case 7:
            return 'Julio';
        case 8:
            return 'Agosto';
        case 9:
            return 'Septiembre';
        case 10:
            return 'Octubre';
        case 11:
            return 'Noviembre';
        case 12:
            return 'Diciembre';
        case 13:
            return 'Anual';
        default:
            return "Indefinido (?)";
    }
}

function mesTablaSaldos(mes) {
    // para determinar el nombre de la columna en la tabla Saldos, que corresponde al mes pasado ...
    let nombreColumnaTablaSaldos = "";

    switch(mes) {
        case 0:
            nombreColumnaTablaSaldos = "Inicial";
            break;
        case 1:
            nombreColumnaTablaSaldos = "Mes01";
            break;
        case 2:
            nombreColumnaTablaSaldos = "Mes02";
            break;
        case 3:
            nombreColumnaTablaSaldos = "Mes03";
            break;
        case 4:
            nombreColumnaTablaSaldos = "Mes04";
            break;
        case 5:
            nombreColumnaTablaSaldos = "Mes05";
            break;
        case 6:
            nombreColumnaTablaSaldos = "Mes06";
            break;
        case 7:
            nombreColumnaTablaSaldos = "Mes07";
            break;
        case 8:
            nombreColumnaTablaSaldos = "Mes08";
            break;
        case 9:
            nombreColumnaTablaSaldos = "Mes09";
            break;
        case 10:
            nombreColumnaTablaSaldos = "Mes10";
            break;
        case 11:
            nombreColumnaTablaSaldos = "Mes11";
            break;
        case 12:
            nombreColumnaTablaSaldos = "Mes12";
            break;
        default:
            nombreColumnaTablaSaldos = "Indefinido";
    }

    return nombreColumnaTablaSaldos;
}


// =======================================================================================================
// para leer y sumarizar los montos de facturas a clientes (a favor) 
function leerYSumarizarFacturasClientes (desde, hasta, ciaContab) { 

    const query = `Select Moneda as moneda, Proveedor as proveedor, Sum(TotalAPagar) As monto 
                   From Facturas 
                   Where FechaEmision Between ? And ? And CxCCxPFlag = 2 And Cia = ?
                   Group by Moneda, Proveedor
                   `;

    const response = Async.runSync(function (done) {
        sequelize.query(query, {
            replacements: [
                moment(desde).format("YYYY-MM-DD"),
                moment(hasta).format("YYYY-MM-DD"),
                ciaContab
            ],
            type: sequelize.QueryTypes.SELECT
        })
            .then(function (result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    return response.result; 
}


// =======================================================================================================
// para leer y sumarizar los montos de facturas a proveedores (en contra)
function leerYSumarizarFacturasProveedores (desde, hasta, ciaContab) { 
    
    const query = `Select Moneda as moneda, Proveedor as proveedor, Sum(TotalAPagar) As monto 
                   From Facturas 
                   Where FechaRecepcion Between ? And ? And CxCCxPFlag = 1 And Cia = ?
                   Group by Moneda, Proveedor
                   `;

    const response = Async.runSync(function (done) {
        sequelize.query(query, {
            replacements: [
                moment(desde).format("YYYY-MM-DD"),
                moment(hasta).format("YYYY-MM-DD"),
                ciaContab
            ],
            type: sequelize.QueryTypes.SELECT
        })
            .then(function (result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    return response.result; 
}


// =======================================================================================================
// para leer y sumarizar montos de pagos efectuados (en contra)
function leerYSumarizarMisPagos (desde, hasta, ciaContab) { 

    const query = `Select Moneda as moneda, Proveedor as proveedor, Sum(Monto) As monto 
                   From Pagos 
                   Where Fecha Between ? And ? And MiSuFlag = 1 And Cia = ?
                   Group by Moneda, Proveedor
                   `;

    const response = Async.runSync(function (done) {
        sequelize.query(query, {
            replacements: [
                moment(desde).format("YYYY-MM-DD"),
                moment(hasta).format("YYYY-MM-DD"),
                ciaContab.numero
            ],
            type: sequelize.QueryTypes.SELECT
        })
            .then(function (result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    return response.result; 
} 


// =======================================================================================================
// para leer y sumarizar montos de pagos recibidos (a favor)
function leerYSumarizarSusPagos (desde, hasta, ciaContab) { 
    
    const query = `Select Moneda as moneda, Proveedor as proveedor, Sum(Monto) As monto  
                   From Pagos 
                   Where Fecha Between ? And ? And MiSuFlag = 2 And Cia = ?
                   Group by Moneda, Proveedor
                   `;

    const response = Async.runSync(function (done) {
        sequelize.query(query, {
            replacements: [
                moment(desde).format("YYYY-MM-DD"),
                moment(hasta).format("YYYY-MM-DD"),
                ciaContab.numero
            ],
            type: sequelize.QueryTypes.SELECT
        })
            .then(function (result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    return response.result; 
} 