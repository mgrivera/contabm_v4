
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Ciudades_sql = sequelize.define('ciudades', {
    ciudad: { type: Sequelize.STRING, field: 'Ciudad', allowNull: false, primaryKey: true, autoIncrement: false, },
    pais: { type: Sequelize.STRING, field: 'Pais', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tCiudades'
});

Paises_sql = sequelize.define('paises', {
    pais: { type: Sequelize.STRING, field: 'Pais', allowNull: false, primaryKey: true, autoIncrement: false,},
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tPaises'
});


Parentescos_sql = sequelize.define('parentescos', {
    parentesco: { type: Sequelize.INTEGER, field: 'Parentesco', allowNull: false, primaryKey: true, autoIncrement: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tParentescos'
});


MaestraRubros_sql = sequelize.define('maestraRubros', {
    rubro: { type: Sequelize.INTEGER, field: 'Rubro', allowNull: false, primaryKey: true, autoIncrement: true, },
    nombreCortoRubro: { type: Sequelize.STRING, field: 'NombreCortoRubro', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false, },
    sueldoFlag: { type: Sequelize.BOOLEAN, field: 'SueldoFlag', allowNull: true, },
    salarioFlag: { type: Sequelize.BOOLEAN, field: 'SalarioFlag', allowNull: true, },
    tipoRubro: { type: Sequelize.INTEGER, field: 'TipoRubro', allowNull: true, },
}, {
     tableName: 'tMaestraRubros'
});


TiposDeCuentaBancaria_sql = sequelize.define('tiposDeCuentaBancaria', {
    tipoCuenta: { type: Sequelize.INTEGER, field: 'TipoCuenta', allowNull: false, primaryKey: true, autoIncrement: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'TiposDeCuentaBancaria'
});


// ----------------------------------------
// Dias feriados y dís de fiesta nacionalñ
// ----------------------------------------
DiasFeriados_sql = sequelize.define('diasFeriados', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, primaryKey: true, autoIncrement: true, },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false, },
    tipo: { type: Sequelize.INTEGER, field: 'Tipo', allowNull: false, },
}, {
     tableName: 'DiasFeriados'
});

DiasFiestaNacional_sql = sequelize.define('diasFiestaNacional', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, primaryKey: true, autoIncrement: true, },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false, },
}, {
     tableName: 'DiasFiestaNacional'
});
