

import angular from 'angular';

import NominaCatalogosParametrosAnticipoSueldo1raQuincena from './anticipoSueldo1raQuinc/anticipoSueldo1raQuinc'; 
import NominaCatalogosParametrosDeduccionesIslr from './deduccionesIslr/deduccionesIslr'; 
import NominaCatalogosParametrosDeduccionesNomina from './deduccionesNomina/deduccionesNomina'; 
import NominaCatalogosParametrosDiasVacacionesPorAno from './diasVacacionesPorAno/diasVacacionesPorAno'; 
import NominaCatalogosParametrosParametrosNomina from './parametrosNomina/parametrosNomina'; 
import NominaCatalogosParametrosSalarioMinimo from './salarioMinimo/salarioMinimo'; 
import NominaParametrosDefinicionUtilidades from './utilidades/angularComponent'; 

export default angular.module('contabm.nomina.catalogos.parametros', [

    NominaCatalogosParametrosAnticipoSueldo1raQuincena.name,       
    NominaCatalogosParametrosDeduccionesIslr.name,       
    NominaCatalogosParametrosDeduccionesNomina.name,     
    NominaCatalogosParametrosDiasVacacionesPorAno.name,        
    NominaCatalogosParametrosParametrosNomina.name,      
    NominaCatalogosParametrosSalarioMinimo.name,  
    NominaParametrosDefinicionUtilidades.name,    

]); 