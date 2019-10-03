

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals'; 
import Sequelize from 'sequelize';

export const UltimoMesCerrado_sql = sequelize.define('ultimoMesCerrado', {
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false,  },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false,  },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false,  },
    manAuto: { type: Sequelize.STRING, field: 'ManAuto', allowNull: false,  },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, primaryKey: true, autoIncrement: false, },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false,  },
}, {
     tableName: 'UltimoMesCerrado'
});
