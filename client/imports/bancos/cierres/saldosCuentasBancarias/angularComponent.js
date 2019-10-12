

import angular from 'angular'; 
import { react2angular } from 'react2angular'

import SaldosCuentasBancarias from './reactComponent'; 

export default angular.module("contabm.bancos.cierres.saldosCuentasBancarias", []).
                       component('saldosCuentasBancarias', react2angular(SaldosCuentasBancarias)); 