
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

import { Proveedores } from '/imports/collections/bancos/proveedoresClientes'; 
import { TimeOffset } from '/globals/globals'; 

import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    'bancos.facturas.obtenerComprobanteRetencionIva': function (folderPath, fileName, listaFacturasID, periodoRetencion) {

        new SimpleSchema({
            folderPath: { type: String, optional: false, },
            fileName: { type: String, optional: false, },
            listaFacturasID: { type: String, blackbox: true, optional: false, },
            periodoRetencion: { type: String, optional: false, },
        }).validate({ folderPath,
                      fileName,
                      listaFacturasID,
                      periodoRetencion,
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
                 f.FechaRecepcion as fechaRecepcion, f.NcNdFlag as ncNdFlag, 
                 f.NumeroComprobante as numeroComprobante, f.NumeroOperacion as numeroOperacion, 
                 f.NumeroControl as numeroControl, f.NumeroFacturaAfectada as numeroFacturaAfectada, 
                 f.Proveedor as proveedor, 
                 f.MontoFacturaSinIva as montoNoImponible, f.MontoFacturaConIva as montoImponible,
                 f.IvaPorc as ivaPorc, f.Iva as iva,
                 f.Cia as cia
                 From Facturas f 
                 Where f.ClaveUnica In ${listaFacturasID} 
                 Order By f.NumeroComprobante, f.NumeroOperacion 
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
        let retencionesIva = [];
        // para guardar la fecha de recepción de una factura y usar para construir la fecha del documento
        let fechaRecepcion = new Date();

        // para totalizar los montos
        let totalIncIva2 = 0;
        let comprasSinIva2 = 0;
        let baseImp2 = 0;
        let iva2 = 0;
        let retIva2 = 0;

        // cada item en este array será una factura a ser impresa 
        let facturasArray = []; 

        facturas.forEach((factura) => {

            factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
            factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;

            fechaRecepcion = factura.fechaRecepcion;

            let numeroFactura = "";
            let numeroNC = "";
            let numeroND = "";

            switch (factura.ncNdFlag) {
                case "NC":
                    numeroNC = factura.numeroFactura;
                    break;
                case "ND":
                    numeroND = factura.numeroFactura;
                    break;
                default:
                    numeroFactura = factura.numeroFactura;
            }

            // TODO: para cada factura leída (casi siempre una!), leemos las retenciones de impuestos Iva; en realidad,
            // también el impuesto Iva, para tener la base Imponible que corresponde a la retención
            query = `Select i.MontoBase as montoBase, i.Porcentaje as porcentaje,
                     i.Monto as monto, d.Predefinido as predefinido
                     From Facturas_Impuestos i Inner Join ImpuestosRetencionesDefinicion d
                     On i.ImpRetID = d.ID
                     Where i.FacturaID = ? And d.Predefinido In (1, 2)`;

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

            let montoFacturaIncluyeIva = 0;

            montoFacturaIncluyeIva += factura.montoFacturaConIva ? factura.montoFacturaConIva : 0;
            montoFacturaIncluyeIva += factura.montoFacturaSinIva ? factura.montoFacturaSinIva : 0;
            montoFacturaIncluyeIva += factura.iva ? factura.iva : 0;

            montoVentasExemptoIva = factura.montoFacturaSinIva ? factura.montoFacturaSinIva : 0;

            let montoImponible = 0;
            let alicuotaIva = 0;
            let montoIva = 0;
            let montoRetencionIva = 0;

            retencionesIva = []; 

            impuestosRetenciones.forEach((impRet) => {

                // nótese que la idea es que se lea primero el Iva y luego la retención; el usuario ha debido
                // registrar estos valores en este orden en la factura, para que vengan aquí así ...
                if (impRet.predefinido === 1) {
                    // predefinido = 1; el registro corresonde al impuesto Iva; leemos el montoBase que, en realidad,
                    // corresonde al monto imponible para la retención Iva
                    montoImponible = impRet.montoBase;
                    alicuotaIva = impRet.porcentaje;
                    montoIva = impRet.monto;
                } else {
                    // predefinido = 2; el registro corresponde a una retención Iva; el monto imponible le leímos en el
                    // registro anterior ...
                    montoRetencionIva = impRet.monto

                    // agregamos la retención al array de retenciones
                    let item = {
                        numOper: factura.numeroOperacion,
                        fecha: moment(factura.fechaEmision).format("DD-MM-YY"),
                        numero: numeroFactura,
                        control: factura.numeroControl,
                        nd: numeroNC,
                        nc: numeroND,
                        factAfectada: factura.numeroFacturaAfectada ? factura.numeroFacturaAfectada : "",
                        totalIncIva: numeral(montoFacturaIncluyeIva).format("0,0.00"),
                        comprasSinIva: numeral(montoVentasExemptoIva).format("0,0.00"),
                        baseImp: numeral(montoImponible).format("0,0.00"),
                        ivaPorc: numeral(alicuotaIva).format("0,0.00"),
                        iva: numeral(montoIva).format("0,0.00"),
                        retIva: numeral(montoRetencionIva).format("0,0.00"),
                    };

                    retencionesIva.push(item);

                    // ahora totalizamos para mostrar totales en la tabla Word; por alguna razón, aunque se pueden
                    // sumarizar columnas en la tabla en Word, hay que hacer un 'upd field'; por esta razón, debemos
                    // calcular y mostrar los totales ...
                    totalIncIva2 += montoFacturaIncluyeIva;
                    comprasSinIva2 += montoVentasExemptoIva;
                    baseImp2 += montoImponible;
                    iva2 += montoIva;
                    retIva2 += montoRetencionIva;
                }
            })

            let proveedor = Proveedores.findOne({ proveedor: factura.proveedor }, { fields: { nombre: 1, rif: 1, }});

            let fechaDoc = `${moment(fechaRecepcion).format('DD')} de ${moment(fechaRecepcion).format('MMMM')} de ${numeral(parseInt(moment(fechaRecepcion).format('YYYY'))).format('0,0')}`;

            let item = { 
                fechaDoc: fechaDoc,
                companiaContabNombre: companiaSeleccionada.nombre,
                companiaContabRif: companiaSeleccionada.rif,
                companiaContabDireccion: companiaSeleccionada.direccion,
                periodoFiscal: periodoRetencion,
                comprobanteSeniat: factura.numeroComprobante,
                proveedorNombre: proveedor.nombre,
                proveedorRif: proveedor.rif,

                items: retencionesIva,

                totalIncIva2: numeral(totalIncIva2).format("0,0.00"),
                comprasSinIva2: numeral(comprasSinIva2).format("0,0.00"),
                baseImp2: numeral(baseImp2).format("0,0.00"),
                iva2: numeral(iva2).format("0,0.00"),
                retIva2: numeral(retIva2).format("0,0.00"),
            }; 

            facturasArray.push(item); 
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

        doc.setData({ 
            facturas: facturasArray, 
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
})
