

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