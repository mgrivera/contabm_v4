

import { Mongo } from 'meteor/mongo';

// para intentar mantener un cache de las cuentas contables que el usuario va usando en la sesion y tenerlas 
// en cualquier parte 
export const CuentasContablesClient = new Mongo.Collection('cuentasContablesClient', {connection: null});