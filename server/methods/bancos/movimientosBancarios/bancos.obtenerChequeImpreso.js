// // @ts-check

import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash'; 

import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';

import JSZip from 'jszip';
import Docxtemplater from 'docxtemplater';

import { Promise } from 'meteor/promise'; 
import path from 'path';
import { readFile, writeFile } from '@cloudcmd/dropbox';

// para leer un node stream y convertirlo en un string; nota: returns a promise 
import getStream from 'get-stream'; 

import SimpleSchema from 'simpl-schema';

import { TimeOffset } from '/globals/globals'; 
import { montoEscrito } from '/imports/general/montoEnLetras';

import { Proveedores_sql } from '/server/imports/sqlModels/bancos/proveedores'; 
import { CuentasBancarias_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Bancos } from '/imports/collections/bancos/bancos';
import { Chequeras_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Monedas_sql } from '/server/imports/sqlModels/monedas'; 

import { CuentasContables_sql } from '/server/imports/sqlModels/contab/cuentasContables'; 
import { AsientosContables_sql, dAsientosContables_sql } from '/server/imports/sqlModels/contab/asientosContables'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

Meteor.methods(
{
    'bancos.obtenerChequeImpreso': function (folderPath, fileName, movimientoBancarioID) 
    {
        new SimpleSchema({
            folderPath: { type: String, optional: false, },
            fileName: { type: String, optional: false, },
            movimientoBancarioID: { type: SimpleSchema.Integer, optional: false, },
            
        }).validate({ fileName, folderPath, movimientoBancarioID, });

        // nos aseguramos que el usuario tenga un nombre en la tabla de usuarios 
        const usuario = Meteor.user(); 
        let message = ""; 

        // el template debe ser siempre un documento word ...
        if (!fileName || !fileName.endsWith('.docx')) {
            message = `El archivo debe ser un documento Word (.docx).`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

        let companiaSeleccionadaUsuario = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionadaUsuario) {
            message = `Error inesperado: no pudimos leer la compañía Contab seleccionada por el usuario.<br />
                       Se ha seleccionado una compañía antes de ejecutar este proceso?`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        const companiaSeleccionada = Companias.findOne(companiaSeleccionadaUsuario ? companiaSeleccionadaUsuario.companiaID : -999,
                                                       { fields: { _id: 1, numero: 1, nombre: 1, nombreCorto: 1 } });

        if (!companiaSeleccionada) {
            message = `Error inesperado: no pudimos leer la compañía Contab seleccionada por el usuario.<br />
                        Se ha seleccionado una compañía antes de ejecutar este proceso?`;
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return {
                error: true,
                message: message,
            }
        }
            
        // antes que nada, leemos el movimientoBancario
        let response = null;
        response = Async.runSync(function(done) {
            MovimientosBancarios_sql.findAll({ where: { claveUnica: movimientoBancarioID },
                include: [
                    { model: Chequeras_sql, as: 'chequera', include: [
                        { model: CuentasBancarias_sql, as: 'cuentaBancaria', },
                    ],},
                ],
                // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (!response.result.length) { 
            message = `Error inesperado: no pudimos leer el movimiento bancario en la base de datos.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }
            
        let movimientoBancario = response.result[0].dataValues;
        
        movimientoBancario.fecha = movimientoBancario.fecha ? moment(movimientoBancario.fecha).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.fechaEntregado = movimientoBancario.fechaEntregado ? moment(movimientoBancario.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.ingreso = movimientoBancario.ingreso ? moment(movimientoBancario.ingreso).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.ultMod = movimientoBancario.ultMod ? moment(movimientoBancario.ultMod).add(TimeOffset, 'hours').toDate() : null;

        // con la cuenta bancaria, obtenemos el banco en mongo ...
        let cuentaBancaria = Array.isArray(response.result) &&
                             response.result[0] &&
                             response.result[0].chequera &&
                             response.result[0].chequera.cuentaBancaria &&
                             response.result[0].chequera.cuentaBancaria.dataValues;

        let banco = Bancos.findOne({ 'agencias.cuentasBancarias.cuentaBancaria': 
                                     (cuentaBancaria.cuentaBancaria ? cuentaBancaria.cuentaBancaria : 'Indefinida') });

        let nombreBanco = "Indefinido";
        let bancoNombreCompleto = "Indefinido"; 
        if (banco) {
            nombreBanco = banco.abreviatura;
            bancoNombreCompleto = banco.nombre; 
        }

        // ahora leemos el asiento contable asociado al movimiento bancario; nótese que puede haber más de uno, cuando el 
        // asiento contable es convertido a otra moneda ... 
        response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findAll({
                where: { provieneDe: 'Bancos', provieneDe_ID: movimientoBancario.claveUnica, cia: companiaSeleccionada.numero, },
                raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (!response.result.length) {
            message = `Error inesperado: no pudimos leer un asiento contable para el movimiento bancario indicado.<br />
            El movimiento bancario debe tener un asiento contable asociado.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        let asientosContables = []; 

        for (let asientoContable of response.result) {

            // ahora que tenemos el asiento, leemos sus partidas
            let response2 = null;
            response2 = Async.runSync(function (done) {
                dAsientosContables_sql.findAll({
                    where: { numeroAutomatico: asientoContable.numeroAutomatico, },
                    raw: true
                })
                    .then(function (result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response2.error) {
                throw new Meteor.Error(response2.error && response2.error.message ? response2.error.message : response2.error.toString());
            }

            let partidasAsientoContable = response2.result;

            // preparamos un array que debemos pasar para combinar con Word ...
            let partidas = [];

            partidasAsientoContable.forEach((x) => {
                // leemos la cuenta en sql; debe existir 
                const cuentaContable = leerCuentaContable(x.cuentaContableID);

                let p = {
                    cuentaContable: cuentaContable ? cuentaContable.cuentaEditada : 'Indefinida',
                    descripcionPartida: x.descripcion,
                    montoPartida: numeral(x.haber != 0 ? (x.haber * -1) : x.debe).format("(0,0.00)"),
                    montoPartidaDebe: numeral(x.haber != 0 ? 0 : x.debe).format("0,0.00"),
                    montoPartidaHaber: numeral(x.haber != 0 ? Math.abs(x.haber) : 0).format("0,0.00"),
                    debe: x.debe, 
                    haber: x.haber, 
                };

                partidas.push(p);
            })

            asientoContable.partidas = partidas; 
            asientosContables.push(asientoContable); 
        }

        // ------------------------------------------------------------------------------------------------------
        // con la cuenta bancaria, obtenemos la moneda; la idea es saber si la moneda es nacional o extranjera 
        response = null;
        response = Async.runSync(function(done) {
            Monedas_sql.findAll({ where: { moneda: cuentaBancaria.moneda }, raw: true, })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
 
        if (!response.result.length) { 
            message = `Error inesperado: no pudimos leer la moneda, que corresponde a la cuenta bancaria, en la base de datos.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        let moneda = response.result[0]; 

        // ------------------------------------------------------------------------------------------------------
        // leemos el proveedor para obener algunos datos más 
        let proveedorNombreContacto1 = ""; 
        let proveedorNombreContacto2 = ""; 
        let proveedorRif = ""; 
        let proveedorNit = ""; 

        // ahora leemos la compañía (prov/clte) asociada al movimiento bancario
        response = null;
        response = Async.runSync(function(done) {
            Proveedores_sql.findAll({
                where: { proveedor: movimientoBancario.provClte ? movimientoBancario.provClte : 0, },
                attributes: [ "nit", "rif", "contacto1", "contacto2", ], 
                raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (response.result.length) {
            let proveedor = response.result[0]; 
            proveedorNombreContacto1 = proveedor.contacto1 ? proveedor.contacto1 : ""; 
            proveedorNombreContacto2 = proveedor.contacto2 ? proveedor.contacto2 : ""; 
            proveedorRif = proveedor.rif ? proveedor.rif : ""; 
            proveedorNit = proveedor.nit ? proveedor.nit : ""; 
        }

        // ----------------------------------------------------------------------------------------------------
        // leemos la tabla de configuración de este proceso para obtener los nombres de las personas
        let configuracionChequeImpreso = ConfiguracionChequeImpreso.findOne({ cia: companiaSeleccionada._id });

        let montoBase = movimientoBancario.montoBase ? Math.abs(movimientoBancario.montoBase) : 0; 
        let comision = movimientoBancario.comision ? Math.abs(movimientoBancario.comision) : 0; 
        let impuestos = movimientoBancario.impuestos ? Math.abs(movimientoBancario.impuestos) : 0; 
        let monto = movimientoBancario.monto ? Math.abs(movimientoBancario.monto) : 0; 

        // preparamos el array que vamos a pasar a setData; agregamos un movimiento (el mismo) para cada asiento contable. 
        // la idea es poder mostrar una página en Word para cada asiento contable. Normalmente, habrá solo un asiento, pero 
        // puede haber más de uno para asientos convertidos a otras monedas 
        let items = []; 

        for (let asientoContable of asientosContables) { 
            let item = { 
                monedaNombre: moneda.descripcion, 
                monedaSimbolo: moneda.simbolo, 
                // nótese como permitimos agregar a la plantilla todos los montos (com, imp, ...); además, también 
                // agregamos montoEscrito para cada uno de ellos 

                montoBase: numeral(montoBase).format("0,0.00"),
                montoBase_enLetras: montoEscrito(montoBase), 

                comision: numeral(comision).format("0,0.00"),
                comision_enLetras: montoEscrito(comision), 

                impuestos: numeral(impuestos).format("0,0.00"),
                impuestos_enLetras: montoEscrito(impuestos), 

                monto: numeral(monto).format("0,0.00"),
                monto_enLetras: montoEscrito(monto), 

                beneficiario: movimientoBancario.beneficiario,
                fechaEscrita: moment(movimientoBancario.fecha).format("DD [de] MMMM"),
                año: numeral(parseInt(moment(movimientoBancario.fecha).format("YYYY"))).format("0,0"),
                añoSinFormato: numeral(parseInt(moment(movimientoBancario.fecha).format("YYYY"))).format("0"),

                concepto: movimientoBancario.concepto,
                numeroComprobante: asientoContable ? asientoContable.numero : '',

                numeroCheque: movimientoBancario.transaccion,

                cuentaBancaria: cuentaBancaria.cuentaBancaria,
                banco: nombreBanco,
                bancoNombreCompleto: bancoNombreCompleto, 

                proveedorNombreContacto1: proveedorNombreContacto1, 
                proveedorNombreContacto2: proveedorNombreContacto2, 
                proveedorRif: proveedorRif, 
                proveedorNit: proveedorNit, 

                p: asientoContable.partidas,

                totalMonto: numeral(lodash.sumBy(asientoContable.partidas, "debe") - lodash.sumBy(asientoContable.partidas, "haber")).format("0,0.00"), 
                totalDebe: numeral(lodash.sumBy(asientoContable.partidas, "debe")).format("0,0.00"),  
                totalHaber: numeral(lodash.sumBy(asientoContable.partidas, "haber")).format("0,0.00"),  

                elaboradoPor: configuracionChequeImpreso && configuracionChequeImpreso.elaboradoPor ? configuracionChequeImpreso.elaboradoPor : ' ',
                revisadoPor: configuracionChequeImpreso && configuracionChequeImpreso.revisadoPor ? configuracionChequeImpreso.revisadoPor : ' ',
                aprobadoPor: configuracionChequeImpreso && configuracionChequeImpreso.aprobadoPor ? configuracionChequeImpreso.aprobadoPor : ' ',
                contabilizadoPor: configuracionChequeImpreso && configuracionChequeImpreso.contabilizadoPor ? configuracionChequeImpreso.contabilizadoPor : ' ',
                nombreCompania: companiaSeleccionada.nombre,
            }

            if (!moneda.nacionalFlag) { 
                // si la moneda no es nacional, cambiamos la palabra 'céntimo' por 'centavo' en la descripción de los montos 
                item.montoBase_enLetras = item.montoBase_enLetras.replace("céntimo", "centavo"); 
                item.comision_enLetras = item.comision_enLetras.replace("céntimo", "centavo"); 
                item.impuestos_enLetras = item.impuestos_enLetras.replace("céntimo", "centavo"); 
                item.monto_enLetras = item.monto_enLetras.replace("céntimo", "centavo"); 
            }

            items.push(item); 
        }

        // -----------------------------------------------------------------------------------------------
        // LEEMOS el template (Word this case) from DropBox 
        // PRIMERO construimos el file path 
        let filePath = path.join(folderPath, fileName); 

        // en windows, path regresa back en vez de forward slashes ... 
        filePath = filePath.replace(/\\/g,"/");

        // SEGUNDO leemos el file 
        const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;      // this is the Dropbox app token 
        let readStream = null; 

        try {
            readStream = Promise.await(readFile(dropBoxAccessToken, filePath));
        } catch(err) { 
            message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

        let content = null; 

        try {
            // from npm: convert a node stream to a string or buffer; note: returns a promise 
            content = Promise.await(getStream.buffer(readStream)); 
        } catch(err) { 
            message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

        let zip = new JSZip(content);
        let doc = new Docxtemplater();
        doc.loadZip(zip);

        doc.setData({
            items: items, 
        })

        try {
            // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
            doc.render();
        }
        catch (error) {
            var e = {
                message: error.message,
                name: error.name,
                stack: error.stack,
                properties: error.properties,
            }
            throw new Meteor.Error('error-render-Docxtemplater',
                `Error: se ha producido un error al intentar generar un documento docx usando DocxTemplater.
                 El mensaje de error recibido es: ${JSON.stringify({error: e})}.
                `);
        }

        let buf = doc.getZip().generate({ type:"nodebuffer" });

        // -----------------------------------------------------------------------------------------------
        let nombreUsuario = usuario.emails[0].address;

        let nombreUsuario2 = nombreUsuario.replace(/\./g, "_");           // nombre del usuario: reemplazamos un posible '.' por un '_' 
        nombreUsuario2 = nombreUsuario2.replace(/\@/g, "_");              // nombre del usuario: reemplazamos un posible '@' por un '_' 
        
        // construimos un id único para el archivo, para que el usuario pueda tener más de un resultado para la misma 
        // plantilla. La fecha está en Dropbox ... 
        let fileId = new Mongo.ObjectID()._str.substring(0, 6); 

        let fileName2 = fileName.replace('.docx', `_${nombreUsuario2}_${fileId}.docx`);

        // finalmente, escribimos el archivo resultado, al directorio tmp 
        let filePath2 = path.join(folderPath, "tmp", fileName2); 

        // en windows, path regresa back en vez de forward slashes ... 
        filePath2 = filePath2.replace(/\\/g,"/");

        try {
            Promise.await(writeFile(dropBoxAccessToken, filePath2, buf));
        } catch(err) { 
            message = `Error: se ha producido un error al intentar escribir el archivo ${filePath2} a Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

        // ----------------------------------------------------------------------------------------------------------------
        // authenticamos en dropbox para usar la clase y sus métodos; la idea es obtner un 'shared link' que pasaremos al 
        // browser para hacer el download ... 
        const dbx = new Dropbox({
            accessToken: dropBoxAccessToken,
            fetch: fetch
        });

        // ahora intentamos obtener un link (url) al file que acabamos de grabar en dropbox; nótese que este link 
        // es un 'shared link' que construye dropbox. Además, permite indicar un vencimiento para el mismo que debe tener
        // la forma "2017-12-10T00:00:00Z"; sin embargo, hasta donde entendemos, no podemos usar este expires feature con 
        // dropbox free 
        response = null; 
        let dropBoxFileUrl = ""; 

        try {
            // from npm: convert a node stream to a string or buffer; note: returns a promise 
            response = Promise.await(dbx.sharingCreateSharedLinkWithSettings({ path: filePath2 }));
            dropBoxFileUrl = response.url; 
        } catch (err) {
            message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `;
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            console.log(""); 
            console.log("Ha ocurrido un error al intentar obtener el link (shared) para el archivo desde el dropbox: ", err); 

            return {
                error: true,
                message: message,
            }
        } 


        message = `Ok, la plantilla ha sido aplicada a los datos seleccionados y el documento <em>Word</em> ha sido construido 
                   en forma satisfactoria. <br /> 
                   Por favor, haga un <em>click</em> en el <em>link</em> que sigue para bajar el archivo y copiarlo en su máquina.  
                  `; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: message, 
            // nótese que regresamos el access tokey y el shared link para preparar el download del file en el client 
            dropBoxAccessToken: dropBoxAccessToken, 
            url: dropBoxFileUrl, 
            fileName: fileName, 
        }
    }
})


function leerCuentaContable(id) { 

    const response = Async.runSync(function(done) {
        CuentasContables_sql.findByPk(id)
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })
    
    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
    
    const cuentaContable = response.result;
    return cuentaContable;  
}