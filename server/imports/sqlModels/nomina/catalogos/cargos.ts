

import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const Cargos_sql = sequelize.define('cargos', {
    cargo: { type: Sequelize.INTEGER, field: 'Cargo', allowNull: false, primaryKey: true, autoIncrement: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tCargos'
});