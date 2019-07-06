

import angular from 'angular'; 
import { react2angular } from 'react2angular'

import './listaPagosAnticipoAplicarModal.html'; 
import PagosAnticipoListaReact from './reactComponent'; 

// Este controller (angular) se carga con la página primera del programa
export default angular.module("contabm").component('pagosAnticipoLista', react2angular(PagosAnticipoListaReact))