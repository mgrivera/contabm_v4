

import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

// ----------------------------------------
// Grupos de empleados
// ----------------------------------------
export const tGruposEmpleados_sql = sequelize.define('gruposEmpleados', {
    grupo: { type: Sequelize.INTEGER, field: 'Grupo', allowNull: false, primaryKey: true, autoIncrement: true, },
    nombre: { type: Sequelize.STRING, field: 'NombreGrupo', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
    grupoNominaFlag: { type: Sequelize.BOOLEAN, field: 'GrupoNominaFlag', allowNull: false,  },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     tableName: 'tGruposEmpleados'
})

export const tdGruposEmpleados_sql = sequelize.define('gruposEmpleados_Empleados', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, primaryKey: true, autoIncrement: true, },
    empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: false, },
    grupo: { type: Sequelize.INTEGER, field: 'Grupo', allowNull: false, },
    suspendidoFlag: { type: Sequelize.BOOLEAN, field: 'SuspendidoFlag', allowNull: false,  },
}, {
     tableName: 'tdGruposEmpleados'
})

tGruposEmpleados_sql.hasMany(tdGruposEmpleados_sql, { as: 'empleados', foreignKey: 'grupo' } );
tdGruposEmpleados_sql.belongsTo(tGruposEmpleados_sql, { as: 'grupoEmpleados', foreignKey: 'grupo' } );
