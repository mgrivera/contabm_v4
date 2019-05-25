

import angular from 'angular'; 
import { react2angular } from 'react2angular'

import './asientosContables_respaldar.html'; 
import AsientosContablesRespaldarReactComponent from './asientosContablesRespaldarReactComponent'; 

// Este controller (angular) se carga con la página primera del programa
export default angular.module("contabm.administracion.utilitarios.asientosContablesRespaldar", [])
                      .component('asientosContablesRespaldar', react2angular(AsientosContablesRespaldarReactComponent))
