

import { Meteor } from 'meteor/meteor'
import { Monedas } from '../../imports/collections/monedas';

Meteor.publish('monedas', function () {
        return [
            Monedas.find(),
        ];
});
