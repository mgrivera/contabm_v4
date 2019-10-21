

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

import SimpleSchema from 'simpl-schema';

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'bancos.facturas.obtenerFacturaImpresa': function (folderPath, fileName, listaFacturasID) {

        new SimpleSchema({
            folderPath: { type: String, optional: false, },
            fileName: { type: String, optional: false, },
            listaFacturasID: { type: String, optional: false, },
        }).validate({ folderPath, fileName, listaFacturasID, });

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

        let query = '';
        let response = null;
            
        // leemos las facturas que el usuario ha consultado 
        query = `Select f.NumeroFactura as numeroFactura, f.FechaEmision as fechaEmision,
                 p.Nombre as nombreCompania, p.Rif as rifCompania, p.Direccion as domicilioCompania,
                 p.Telefono1 as telefonoCompania, p.Fax as faxCompania,
                 f.Concepto as concepto, fp.Descripcion as formaDePagoNombre,
                 f.MontoFacturaSinIva as montoNoImponible, f.MontoFacturaConIva as montoImponible,
                 f.IvaPorc as ivaPorc, f.Iva as iva,
                 f.Cia as cia
                 From Facturas f Inner Join Proveedores p On f.Proveedor = p.Proveedor
                 Inner Join FormasDePago fp On f.CondicionesDePago = fp.FormaDePago
                 Where f.ClaveUnica In ${listaFacturasID}
                `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

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

        // -----------------------------------------------------------------------------------------------------
        // leemos la tabla ParametrosBancos para obtener las lineas que se muestran como notas para la compañía
        query = `Select FooterFacturaImpresa_L1, FooterFacturaImpresa_L2, FooterFacturaImpresa_L3
                 From ParametrosBancos
                 Where Cia = ?
                `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ facturas[0].cia ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!response.result.length) {
            message = `Error inesperado: no hemos podido leer un registro en la tabla
                       <b><em>ParametrosBancos</em></b> para la compañía <em>Contab</em> seleccionada.`;
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return {
                error: true,
                message: message,
            }
        }

        let parametrosBancos = response.result[0];

        let items = [];
        let facturaItem = {};

        facturas.forEach((factura) => {

            factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;

            let monto = 0;
            let montoNoImponible = factura.montoNoImponible ? factura.montoNoImponible : 0;
            let montoImponible = factura.montoImponible ? factura.montoImponible : 0;
            let ivaPorc = factura.ivaPorc ? factura.ivaPorc : 0;
            let montoIva = factura.iva ? factura.iva : 0;
            let total = 0;

            // en realidad el ivaPorc no viene con la factura; tendríamos que leerlo en FacturasImpuestos; lo
            // calculamos
            if (montoIva && montoImponible) {
                ivaPorc = montoIva * 100 / montoImponible;
            }

            monto = montoNoImponible + montoImponible;
            total = monto + montoIva;

            facturaItem = {};
            facturaItem = {
                numeroFactura: factura.numeroFactura,
                fechaEmision: factura.fechaEmision ? moment(factura.fechaEmision).format('DD-MM-YYYY') : '',
                nombreCompania: factura.nombreCompania,
                rifCompania: factura.rifCompania,
                domicilioCompania: factura.domicilioCompania,
                telefonoCompania: factura.telefonoCompania ? factura.telefonoCompania : '',
                faxCompania: factura.faxCompania ? factura.faxCompania : '',
                condicionesDePago: factura.formaDePagoNombre,
                conceptoFactura: factura.concepto,
                monto: numeral(monto).format("0,0.00"),
                montoNoImponible: numeral(montoNoImponible).format("0,0.00"),
                montoImponible: numeral(montoImponible).format("0,0.00"),
                ivaPorc: numeral(ivaPorc).format("0,0.00"),
                montoIva: numeral(montoIva).format("0,0.00"),
                total: numeral(total).format("0,0.00"),
                notas1: parametrosBancos.FooterFacturaImpresa_L1 ? parametrosBancos.FooterFacturaImpresa_L1 : '',
                notas2: parametrosBancos.FooterFacturaImpresa_L2 ? parametrosBancos.FooterFacturaImpresa_L2 : '',
                notas3: parametrosBancos.FooterFacturaImpresa_L3 ? parametrosBancos.FooterFacturaImpresa_L3 : '',
            };

            items.push(facturaItem);
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
            facturas: items,
        });

        try {
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
