

import angular from 'angular'; 
import { react2angular } from 'react2angular'

import DefinicionCuentasContables from './reactComponent'; 

// Este controller (angular) se carga con la página primera del programa
export default angular.module("contabm.bancos.catalogos.definicionCuentasContables.editarListaModal.angularComponent", [])
                      .component('definicionCuentasContables', react2angular(DefinicionCuentasContables))