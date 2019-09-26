

import { Meteor } from 'meteor/meteor'; 
import { Promise } from 'meteor/promise'; 
import SimpleSchema from 'simpl-schema';
import { readDir } from '@cloudcmd/dropbox';

Meteor.methods({
    'plantillas.obtenerListaArchivosDesdeDirectorio': function (folderPath) {

        new SimpleSchema({
            folderPath: { type: String }
        }).validate({ folderPath });

        const sort = 'name';
        const order = 'asc';
        const token = Meteor.settings.public.dropBox_appToken;
        const type = 'raw';

        let files = {}; 
        let message = ""; 
        let error = false; 
        
        try {
            files = Promise.await(readDir(token, folderPath, { type, sort, order }));
            files = files.files.filter(x => x.type === "file"); 
        } catch(err) { 
            message = `Error: se ha producido un error al intentar obtener el contenido del directorio en Dropbox. <br />
                El mensaje del error obtenido es: ${err}
                `; 
            return { 
                error: true, 
                message: message, 
            }
        } 

        if (!error && files && Array.isArray(files) && files.length) { 
            const filesCount =  files.length.toString(); 
            message = `Ok, hemos leído <b>${filesCount}</b> archivos para este tipo de plantillas. `; 
        } else { 
            message = `Error: no hemos podido leer plantillas registradas en Dropbox, para este tipo de proceso en particular. <br /> 
                       Ud. debe registrar al menos una plantilla para este tipo de proceso, en el directorio adecuado 
                       (<em>${folderPath}</em>) en el Dropbox del programa. 
                      `; 
                return { 
                    error: true, 
                    message: message, 
            }
        }

        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???
        
        return { 
            error: error, 
            message: message, 
            files: files, 
        }
   }, 
})