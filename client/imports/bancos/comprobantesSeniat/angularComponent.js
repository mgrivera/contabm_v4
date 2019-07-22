

import angular from 'angular'; 
import { react2angular } from 'react2angular'

import ComprobantesSeniatReact from './reactComponent'; 

// Este controller (angular) se carga con la página primera del programa
export default angular.module("contabm.bancos.comprobantesSeniat.angularComponent", []).
                       component('comprobantesSeniat', react2angular(ComprobantesSeniatReact))