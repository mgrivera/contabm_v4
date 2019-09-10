

import angular from 'angular'; 
import { react2angular } from 'react2angular'

import CuentasContablesSearchModal from './reactComponent'; 

// Este controller (angular) se carga con la página primera del programa
export default angular.module("contabm.generales.cuentasContablesSearchModal", [])
                      .component('cuentasContablesSearchModal', react2angular(CuentasContablesSearchModal))