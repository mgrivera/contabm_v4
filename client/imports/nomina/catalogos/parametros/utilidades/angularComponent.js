

import angular from 'angular'; 
import { react2angular } from 'react2angular'

import NominaParametrosDefinicionUtilidades from './reactComponent'; 

export default angular.module("contabm.nomina.catalogos.parametros.definicionUtilidades", []).
                       component('nominaParametrosDefinicionUtilidades', react2angular(NominaParametrosDefinicionUtilidades)); 