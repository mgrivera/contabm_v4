

import { Meteor } from 'meteor/meteor'
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import numeral from 'numeral';

import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';

import JSZip from 'jszip';
import Docxtemplater from 'docxtemplater';

import { Promise } from 'meteor/promise'; 
import path from 'path';
import { readFile, writeFile } from '@cloudcmd/dropbox';

// para leer un node stream y convertirlo en un string; nota: returns a promise 
import getStream from 'get-stream'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

import { TimeOffset } from '/globals/globals'; 

import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    'bancos.facturas.obtenerComprobanteRetencionIslr': function (folderPath, fileName, listaFacturasID) {

        new SimpleSchema({
            folderPath: { type: String, optional: false, },
            fileName: { type: String, optional: false, },
            listaFacturasID: { type: String, optional: false, },
        }).validate({ folderPath,
                      fileName,
                      listaFacturasID,
                  });

        // nos aseguramos que el usuario tenga un nombre en la tabla de usuarios 
        const usuario = Meteor.user(); 

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

        const companiaSeleccionada = Companias.findOne(companiaSeleccionadaUsuario ? companiaSeleccionadaUsuario.companiaID : -999);

        if (!companiaSeleccionada) {
            message = `Error inesperado: no pudimos leer la compañía Contab seleccionada por el usuario.<br />
                        Se ha seleccionado una compañía antes de ejecutar este proceso?`;
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return {
                error: true,
                message: message,
            }
        }

        // leemos las facturas que el usuario ha consultado 
        query = `Select f.ClaveUnica as claveUnica, f.NumeroFactura as numeroFactura, f.FechaEmision as fechaEmision, 
                 f.FechaRecepcion as fechaRecepcion, 
                 f.NumeroControl as numeroControl, 
                 f.Proveedor as proveedor, 
                 f.MontoFacturaSinIva as montoNoImponible, f.MontoFacturaConIva as montoImponible,
                 f.Cia as cia
                 From Facturas f 
                 Where f.ClaveUnica In ${listaFacturasID} 
                `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!response.result.length) { 
            message = `Error inesperado: no pudimos leer la factura en la base de datos.`;
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return {
                error: true,
                message: message,
            }
        }
            
        let facturas = response.result;
        let retencionesIslr = [];
        // para guardar la fecha de recepción de una factura y usar para construir la fecha del documento
        let fechaRecepcion = new Date();
        let proveedorID = 0;
        let ciaContabID = 0;

        // para mostrar totales en la tabla Word
        let impuestoRetenido2 = 0;
        let totalPagado2 = 0;

        // cada item en este array será una factura (en realidad sus retenciones) a ser impresa 
        let facturasParaImprimirEnWord = []; 

        facturas.forEach((factura) => {

            factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
            factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;

            fechaRecepcion = factura.fechaRecepcion;
            proveedorID = factura.proveedor;
            ciaContabID = factura.cia;

            // TODO: para cada factura leída leemos las retenciones de impuestos Islr
            query = `Select i.FacturaID as facturaID, i.MontoBase as montoBase, i.Porcentaje as porcentaje,
                     i.Sustraendo as sustraendo, i.Monto as monto,
                     d.Predefinido as predefinido
                     From Facturas_Impuestos i Inner Join ImpuestosRetencionesDefinicion d
                     On i.ImpRetID = d.ID
                     Where i.FacturaID = ? And d.Predefinido In (3)`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ factura.claveUnica ], type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            let impuestosRetenciones = response.result;

            let montoFactura = 0;
            montoFactura += factura.montoFacturaSinIva ? factura.montoFacturaSinIva : 0;
            montoFactura += factura.montoFacturaConIva ? factura.montoFacturaConIva : 0;

            retencionesIslr = [];

            impuestosRetenciones.forEach((impRet) => {

                    // agregamos la retención al array de retenciones
                    let item = {
                        fechaRecepcion: moment(factura.fechaRecepcion).format("DD-MM-YY"),
                        numeroFactura: factura.numeroFactura,
                        numeroControl: factura.numeroControl ? factura.numeroControl : ' ',
                        montoFactura: montoFactura ? numeral(montoFactura).format("0,0.00") : '',
                        montoSujetoARetencion: impRet.montoBase ? numeral(impRet.montoBase).format("0,0.00") : '',
                        retencionPorc: impRet.porcentaje ? numeral(impRet.porcentaje).format("0,0.00") : '',
                        retencionSustraendo: impRet.sustraendo ? numeral(impRet.sustraendo).format("0,0.00") : '',
                        impuestoRetenido: impRet.monto ? numeral(impRet.monto).format("0,0.00") : '',
                        totalPagado: (impRet.montoBase && impRet.monto) ? numeral(impRet.montoBase - impRet.monto).format("0,0.00") : '',
                    };

                    // -----------------------------------------------------------------------------------
                    // leemos el pago asociado a la factura; nótese que puede no haber uno o haber varios;
                    // por ahora, simplemente, intentamos leer uno ...
                    query = `Select Top 1 p.Fecha as fechaPago
                             From Pagos p Inner Join dPagos d On p.ClaveUnica = d.ClaveUnicaPago
                             Inner Join CuotasFactura c On d.ClaveUnicaCuotaFactura = c.ClaveUnica
                             Inner Join Facturas f On c.ClaveUnicaFactura = f.ClaveUnica
                             Where f.ClaveUnica = ? Order by p.Fecha Desc`;

                    response = null;
                    response = Async.runSync(function(done) {
                        sequelize.query(query, { replacements: [ impRet.facturaID ], type: sequelize.QueryTypes.SELECT })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });

                    if (response.error) { 
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }
                        
                    // nos aseguramos de haber leído un pago
                    item.fechaPago = "";
                    if (response.result && _.isArray(response.result) && response.result.length) {
                        // ajustamos la fecha de pago para corregir el ajuste a 'local date' que hace sequelize
                        let fechaPago = moment(response.result[0].fechaPago).add(TimeOffset, 'hours').toDate();
                        item.fechaPago = moment(fechaPago).format("DD-MMM-YYYY");
                    }

                    retencionesIslr.push(item);

                    // ahora totalizamos para mostrar totales en la tabla Word; por alguna razón, aunque se pueden
                    // sumarizar columnas en la tabla en Word, hay que hacer un 'upd field'; por esta razón, debemos
                    // calcular y mostrar los totales ...
                    impuestoRetenido2 += impRet.monto ? impRet.monto : 0;
                    totalPagado2 += (impRet.montoBase && impRet.monto) ? impRet.montoBase - impRet.monto : 0; 
            })

            // como no tenemos la dirección ni la ciudad del proveedor en mongo (al menos por ahora), lo
            // leemos con un query en Sql Server
            query = `Select p.Nombre as nombre, p.Rif as rif, p.Direccion as direccion, c.Descripcion as nombreCiudad,
                     p.Telefono1 as telefono1
                     From Proveedores p Inner Join tCiudades c On p.Ciudad = c.Ciudad
                     Where p.Proveedor = ?`;

            response = null;
            response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ proveedorID ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
            
            if (!response.result || !_.isArray(response.result) || !response.result.length) { 
                throw new Meteor.Error('proveedor-no-encontrado',
                    'Error inesperado: no pudimos leer los datos del proveedor en la base de datos.');
            }
            
            let proveedor = response.result[0];

            let periodoRetencion = `01 de Enero de ${moment(fechaRecepcion).format('YYYY')} hasta 31 de Diciembre de ${moment(fechaRecepcion).format('YYYY')}`;

            // let fechaDoc = `${moment(fechaRecepcion).format('DD')} de ${moment(fechaRecepcion).format('MMMM')} de ${numeral(parseInt(moment(fechaRecepcion).format('YYYY'))).format('0,0')}`;

            facturasParaImprimirEnWord.push({ 

                fechaDoc: moment(fechaRecepcion).format("DD-MMM-YYYY"),

                proveedorNombre: proveedor.nombre,
                proveedorRif: proveedor.rif,
                proveedorDireccion: proveedor.direccion,
                proveedorTelefono: proveedor.telefono1 ? proveedor.telefono1 : ' ',
                proveedorCiudad: proveedor.nombreCiudad,

                companiaContabNombre: companiaSeleccionada.nombre,
                companiaContabRif: companiaSeleccionada.rif,
                companiaContabTelefono: companiaSeleccionada.telefono1,
                companiaContabDireccion: companiaSeleccionada.direccion,

                periodoRetencion: periodoRetencion,

                items: retencionesIslr,

                impuestoRetenido2: numeral(impuestoRetenido2).format("0,0.00"),
                totalPagado2: numeral(totalPagado2).format("0,0.00"),
            })
        })

        
        // -----------------------------------------------------------------------------------------------
        // LEEMOS el template (Word this case) from DropBox 
        // PRIMERO construimos el file path 
        let filePath = path.join(folderPath, fileName); 

        // en windows, path regresa back en vez de forward slashes ... 
        filePath = filePath.replace(/\\/g,"/");

        // SEGUNDO leemos el file 
        const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;      // this is the Dropbox app dropBoxAccessToken 
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

        //set the templateVariables
        doc.setData({
            facturas: facturasParaImprimirEnWord, 
        });

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
        filePath2 = path.join(folderPath, "tmp", fileName2); 

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
});
