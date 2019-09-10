

import angular from 'angular'; 

import AngularUIGenericModal from '/client/imports/general/genericUIBootstrapModal/angularGenericModal'; 
import CuentasContablesSearch from '/client/imports/general/cuentasContablesSearchModal/angularComponent'; 

export default angular.module("contabm.generales", [ AngularUIGenericModal.name, 
                                                     CuentasContablesSearch.name, ]); 