

import * as angular from 'angular';

// importamos controllers y plantillas que pueden ser usados en 'children' angular modules  
import '/client/imports/bancos/catalogos/categoriasRetencion/categoriasRetencion.html'; 
import '/client/imports/bancos/catalogos/categoriasRetencion/categoriasRetencion';

import '/client/imports/bancos/catalogos/unidadTributaria/unidadTributaria.html'; 
import UnidadTributariaController from '/client/imports/bancos/catalogos/unidadTributaria/unidadTributaria';

import BancosComprobantesSeniat from '/client/imports/bancos/comprobantesSeniat/comprobantesSeniat'; 
import '/client/imports/bancos/comprobantesSeniat/comprobantesSeniat.html'; 

import ContabBancosCierres from "/client/imports/bancos/cierres/angular.module.bancos.cierres"; 

angular.module("contabm.bancos", [ 'contabm.bancos.catalogos', 
                                   'categoriasRetencion', 
                                   UnidadTributariaController.name, 
                                   BancosComprobantesSeniat.name, 
                                   ContabBancosCierres.name, ]);
