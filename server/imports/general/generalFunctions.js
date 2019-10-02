

import lodash from 'lodash'; 
import moment from 'moment'; 

// --------------------------------------------------------------------
// funciones generales que pueden ser usadas en multiples contextos 
// --------------------------------------------------------------------

export const ensureValueIsDate = function (date) { 
    
    try {
        date.toISOString();
      } catch (e) {
        // probablemente, el valor viene como un string, pero en forma de date válido 
        if (isValidDate(date)) { 
            date = new Date(date); 
        } else { 
            date = new Date();
        }
      }

      return date;
}


function isValidDate(date) {
    return date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
}

export const montoConMasDeDosDecimales = (monto) => {

    if (monto != lodash.round(monto, 2)) {
        return true;
    }
    return false;
}

export const ensureValueIsDate2 = function (value) { 

    // si el valor es un date, regresamos tal cual 
    if (Object.prototype.toString.call(value) === '[object Date]') { 
        return value; 
    }

    // si value es null/undefined, lo regresamos tal cual 
    if (value === null || typeof value === 'undefined') { 
        return value; 
    }

    // si value no es un string, lo regresamos tal cual 
    if (type(value) != 'string') { 
        return value; 
    }

    // Ok, value es un string; puede o no ser un  valid date string ... 
    const stringIsDate = moment(value).isValid(); 

    // si el string es un valid date, convertimos y regresamos 
    if (stringIsDate) { 
        return moment(value); 
    } 

    // ok, el value es un string, pero no es un valid string date; regresamos tal cual; esto no debe ocurrir 
    return value; 
}

// encontramos en Internet ... usamos aquí para saber si algo es string; aunque haya sido creado como: new String(x), 
// lo cual es super improbable, por supuesto ... 
var type = function(obj) {
    // You can use this function to determine the type of anything (not dates, though) 
    return Object.prototype.toString.apply(obj).replace(/\[object (.+)\]/i, '$1').toLowerCase();
}