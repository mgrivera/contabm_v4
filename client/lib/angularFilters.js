

import lodash from 'lodash'; 
import numeral from "numeral";
import moment from "moment";
import { Monedas } from '/imports/collections/monedas';
import { Companias } from '/imports/collections/companias';
import { GruposContables } from '/imports/collections/contab/gruposContables'; 

import { CuentasContablesClient } from '/client/imports/clientCollections/cuentasContables'; 

// ---------------------------------------------------------------------------------------
// ui-grid: para formatear fields numéricos y dates
// ---------------------------------------------------------------------------------------
angular.module("contabm").filter('currencyFilter', function () {
    return function (value) {
        return numeral(value).format('0,0.00');
    };
})

angular.module("contabm").filter('number8decimals', function () {
    return function (value) {
        if (lodash.isFinite(value))
            return numeral(value).format('0.00000000');
        else
            return "";
    };
})

angular.module("contabm").filter('number6decimals', function () {
    return function (value) {
        if (lodash.isFinite(value))
            return numeral(value).format('0.000000');
        else
            return "";
    };
})

angular.module("contabm").filter('currencyFilterAndNull', function () {
    return function (value) {
        if (lodash.isFinite(value))
            return numeral(value).format('0,0.00');
        else
            return "";
    };
})

angular.module("contabm").filter('currencyFilterAndNull6Decimals', function () {
    return function (value) {
        if (lodash.isFinite(value))
            return numeral(value).format('0,0.000000');
        else
            return "";
    };
})

angular.module("contabm").filter('currencyFilterNorCeroNorNull', function () {
    return function (value) {
        if (value)
            return numeral(value).format('0,0.00');
        else
            return "";
    };
})

angular.module("contabm").filter('currencyFilterNorCeroNorNull4decimals', function () {
    return function (value) {
        if (value)
            return numeral(value).format('0,0.0000');
        else
            return "";
    };
})


angular.module("contabm").filter('dateFilter', function () {
    return function (value) {
        if (value)
            return moment(value).format('DD-MM-YY');
        else
            return "";
    };
})

angular.module("contabm").filter('dateTimeFilter', function () {
    return function (value) {
        if (value)
            return moment(value).format('DD-MM-YY h:m a');
        else
            return "";
    };
})

angular.module("contabm").filter('dateTimeShortFilter', function () {
    return function (value) {
        if (value)
            return moment(value).format('DD-MM-YY h a');
        else
            return "";
    };
})

let estadosFactura = [
    { estado: 1, descripcion: 'Pendiente', },
    { estado: 2, descripcion: 'Parcial', },
    { estado: 3, descripcion: 'Pagada', },
    { estado: 4, descripcion: 'Anulada', },
];

angular.module("contabm").filter('nombreEstadoFactura', function () {
    return function (estadoFactura) {
        var found = lodash.find(estadosFactura, function (x) { return x.estado === estadoFactura; });
        return found ? found.descripcion : "Indefinido";
    };
})

angular.module("contabm").filter('boolFilter', function () {
    return function (value) {
        return value ? "Ok" : "";
    };
})

angular.module("contabm").filter('grupoContableFilter', function () {
    return function (grupoContableID) {
        var grupoContable = GruposContables.findOne({ grupo: grupoContableID });
        return !grupoContable || lodash.isEmpty(grupoContable) ? "Indefinido" : grupoContable.descripcion;
    };
})

angular.module("contabm").filter('tipoCompania2Filter', function () {
    // la diferencia con el anterior es que aquí recibimos una compañía, la buscamos; buscamos su tipo y lo regresamos
    return function (companiaID) {

        var compania = Companias.findOne(companiaID);

        if (!compania)
            return " ";

        if (compania.nosotros)
            return " ";

        var found = lodash.find(tiposCompania, function (t) { return t.tipo == compania.tipo; });

        return found ? found.descripcion : "Indefinido";
    };
})

// para mostrar las chequeras en el Select en la página que permite agregar mov bancarios;
// la idea es mostrar: banco + mon + cuenta + etc.
angular.module("contabm").filter('formatChequera', function () {
    return function (chequera) {
        let descripcionChequera = "";
        if (chequera.generica) {
            let numeroCuentaBancaria = chequera.numeroCuentaBancaria ? chequera.numeroCuentaBancaria : "?";

            if (numeroCuentaBancaria != "?" && numeroCuentaBancaria.length > 6) {
                numeroCuentaBancaria = numeroCuentaBancaria.substr(0, 3) + '~' + numeroCuentaBancaria.substr(-3);       // para mostrar solo los 3 ultimos chars ...
            };

            descripcionChequera = `${chequera.abreviaturaBanco} - ${chequera.simboloMoneda} - ${numeroCuentaBancaria} - Gen`;
        } else {

            let desde = chequera.desde ? chequera.desde.toString() : "0";
            let hasta = chequera.hasta ? chequera.hasta.toString() : "0";
            let ultimoChequeUsado = chequera.ultimoChequeUsado ? chequera.ultimoChequeUsado.toString() : "0";
            let numeroCuentaBancaria = chequera.numeroCuentaBancaria ? chequera.numeroCuentaBancaria : "?";

            if (desde != "0" && desde.length > 3) {
                desde = desde.substr(-3);       // para mostrar solo los 3 ultimos chars ...
            };
            if (hasta != "0" && hasta.length > 3) {
                hasta = hasta.substr(-3);       // para mostrar solo los 3 ultimos chars ...
            };
            if (ultimoChequeUsado != "0" && ultimoChequeUsado.length > 3) {
                ultimoChequeUsado = ultimoChequeUsado.substr(-3);       // para mostrar solo los 3 ultimos chars ...
            };
            if (numeroCuentaBancaria != "?" && numeroCuentaBancaria.length > 6) {
                numeroCuentaBancaria = numeroCuentaBancaria.substr(0, 3) + '~' + numeroCuentaBancaria.substr(-3);       // para mostrar solo los 3 ultimos chars ...
            };

            descripcionChequera = `${chequera.abreviaturaBanco} - ${chequera.simboloMoneda} - ${numeroCuentaBancaria} - ${desde}/${hasta} - ${ultimoChequeUsado}`;
        };
        return descripcionChequera;
    };
})


angular.module("contabm").filter('empresaUsuariaSeleccionadaFilter', function () {
    return function (companiaID) {
        var compania = Companias.findOne(companiaID, { fields: { nombre: 1 } });
        return !compania || lodash.isEmpty(compania) ? "Indefinido" : compania.nombre;
    };
})

angular.module("contabm").filter('companiaAbreviaturaFilter', function () {
    return function (companiaID) {
        var compania = Companias.findOne({ numero: companiaID }, { fields: { abreviatura: 1 } });
        return !compania || lodash.isEmpty(compania) ? "Indefinido" : compania.abreviatura;
    };
})


angular.module("contabm").filter('companiaNombreCortoFilter', function () {
    return function (companiaID) {
        var compania = Companias.findOne({ _id: companiaID }, { fields: { nombreCorto: 1 } });
        return !compania || lodash.isEmpty(compania) ? "Indefinido" : compania.nombreCorto;
    };
})

angular.module("contabm").filter('companiaNombreCortoFilter_byNumeroContab', function () {
    return function (companiaID) {
        var compania = Companias.findOne({ numero: companiaID }, { fields: { nombreCorto: 1 } });
        return !compania || lodash.isEmpty(compania) ? "Indefinido" : compania.nombreCorto;
    };
})


angular.module("contabm").filter('companiaNombreFilter', function () {
    return function (companiaID) {
        var compania = Companias.findOne({ _id: companiaID }, { fields: { nombre: 1 } });
        return !compania || lodash.isEmpty(compania) ? "Indefinido" : compania.nombre;
    };
})

angular.module("contabm").filter('monedaDescripcionFilter', function () {
    return function (monedaID) {
        var moneda = Monedas.findOne({ moneda: monedaID });
        return !moneda || lodash.isEmpty(moneda) ? "Indefinido" : moneda.descripcion;
    };
})

angular.module("contabm").filter('monedaSimboloFilter', function () {
    return function (monedaID) {
        var moneda = Monedas.findOne({ moneda: monedaID });
        return !moneda || lodash.isEmpty(moneda) ? "Indefinido" : moneda.simbolo;
    };
})

// TODO: pasar el catálogo de cuentas en el $scope para leer la cuenta y regresar el filter 
// TODO: pasar el catálogo de cuentas en el $scope para leer la cuenta y regresar el filter 
angular.module("contabm").filter('cuentaContable_mostrarDescripcion', function () {
    return function (cuentaContableID) {

        if (!cuentaContableID) { 
            return "";
        }

        // usamos el client collection (minimongo) para leer la cuenta y regresar su descripción 
        const cuenta = CuentasContablesClient.findOne({ id: cuentaContableID }); 
        return cuenta ? cuenta.descripcion : `${cuentaContableID} - Indefinida`;
    };
})


angular.module("contabm").filter('mesesAnoFiscal_ano', function () {
    return function (ano) {
        return ano == 0 ? "Mismo año" : "Próximo año";
    };
})

angular.module("contabm").filter('empleadoFilter', function () {
    return function (ciaContab, empleado) {

        leerListaEmpleados(ciaContab)
            .then((result0) => {

                const empleados = result0.items;
                const empleadoItem = empleados.find({ empleado: empleado });

                return empleadoItem ? empleadoItem.alias : "Indefinido";
            })
            .catch((err) => {
                return "Indefinido";
            })
    }
})


const leerListaEmpleados = (ciaContabSeleccionadaID) => { 

    return new Promise((resolve, reject) => { 

        Meteor.call('empleados_lista_leerDesdeSql', ciaContabSeleccionadaID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            if (result && result.error) { 
                reject(result); 
            }
    
            resolve(result)
        })
    })
}


angular.module("contabm").filter('userNameOrEmailFilter', function () {
    return function (userID) {
        if (!userID)
            return "";

        var user = Meteor.users.findOne(userID);
        var userName = 'indefinido';
        if (user)
            if (user.userName)
                userName = user.userName;
            else
                if (Array.isArray(user.emails) && user.emails.length && user.emails[0].address)
                    userName = user.emails[0].address;

        return userName;
    };
});

// ---------------------------------------------------------------------------------------
// para mostrar información de pagos para las cuotas de contratos, fac, sntros, etc.
// ---------------------------------------------------------------------------------------

angular.module("contabm").filter('origenCuota_Filter', function () {
    return function (value) {
        //debugger;
        var source = value;
        return source && source.origen && source.numero ? source.origen + "-" + source.numero : "(???)";
    };
});

angular.module("contabm").filter('cuotaTienePagos_Filter', function () {
    return function (value, scope) {
        //debugger;
        var row = scope.row.entity;
        var cantPagos = row.pagos ? row.pagos.length : 0;

        return cantPagos ? cantPagos.toString() : "";
    };
});

angular.module("contabm").filter('cuotaTienePagoCompleto_Filter', function () {
    return function (value, scope) {
        //debugger;
        var row = scope.row.entity;

        if (!row.pagos || !row.pagos.length)
            // la cuota no tiene pagos; regresamos false (sin un pago completo)
            return "";

        var completo = lodash.some(row.pagos, function (pago) { return pago.completo; });

        return completo ? "Si" : "";
    };
});

// ---------------------------------------------------------------------------------------
// para mostrar 'unsafe' strings (with embedded html) in ui-bootstrap alerts ....
// ---------------------------------------------------------------------------------------
angular.module("contabm").filter('unsafe',
['$sce',
function ($sce) {
    return function (value) {
        if (!value) { return ''; }
        return $sce.trustAsHtml(value);
    };
}
]);


// -----------------------------------------------------------------------------------------------------------
// nota: lo que sigue es para lograr implementar el comportamiento del dropdownlist en el ui-grid ...
// -----------------------------------------------------------------------------------------------------------

angular.module("contabm").filter('mapDropdown', ['uiGridFactory', function (uiGridFactory) {
    return uiGridFactory.getMapDrowdownFilter()
}]);

angular.module("contabm").factory('uiGridFactory', ['$http', '$rootScope', function ($http, $rootScope) {

    var factory = {};

    /* It returns a dropdown filter to help you show editDropdownValueLabel
     *
     * Parameters:
     *
     * - input: selected input value, it always comes when you select a dropdown value
     * - map: Dictionary containing the catalog info. For example:
     *    $scope.languageCatalog = [ {'id': 'EN', 'description': 'English'}, {'id': 'ES', 'description': 'Español'} ]
     * - idLabel: ID label. For this example: 'id'.
     * - valueLabel: Value label. For this example: 'description'.
     *
     * 1) Configure cellFilter this way at the ui-grid colDef:
     *
     * { field: 'languageId', name: 'Language'), editableCellTemplate: 'ui-grid/dropdownEditor',
     *   editDropdownIdLabel: 'id', editDropdownValueLabel: 'description',
     *   editDropdownOptionsArray: $scope.languageCatalog,
     *   cellFilter: 'mapDropdown:row:row.grid.appScope.languageCatalog:"id":"description":languageCatalog' },
     *
     * 2) Append this snippet to the controller:
     *
     * .filter('mapDropdown', function(uiGridFactory) {
     *    return uiGridFactory.getMapDrowdownFilter()
     * });
     *
     */
    factory.getMapDrowdownFilter = function () {

        return function (input, map, idLabel, valueLabel) {

            if (map != null) {
                for (var i = 0; i < map.length; i++) {
                    if (map[i][idLabel] === input) {
                        return map[i][valueLabel];
                    }
                }
            }
            return "";
        }
    }

    return factory;
}]);
