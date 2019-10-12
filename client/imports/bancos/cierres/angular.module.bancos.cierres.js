

import angular from 'angular';

import '/client/imports/bancos/cierres/cierre/cierre.html'; 
import BancosCierresCierre from '/client/imports/bancos/cierres/cierre/cierre';

import '/client/imports/bancos/cierres/ultimoMesCerrado/ultimoMesCerrado.html'; 
import BancosCierresUltimoMesCerrado from '/client/imports/bancos/cierres/ultimoMesCerrado/ultimoMesCerrado'; 

import '/client/imports/bancos/cierres/saldosCuentasBancarias/saldosCuentasBancarias';
import BancosSaldosCuentasBancarias from '/client/imports/bancos/cierres/saldosCuentasBancarias/angularComponent'; 

export default angular.module("contabm.bancos.cierres", [ BancosCierresCierre.name, 
                                                          BancosCierresUltimoMesCerrado.name, 
                                                          BancosSaldosCuentasBancarias.name, ]);