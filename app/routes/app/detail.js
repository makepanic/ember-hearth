import Ember from 'ember';

export default Ember.Route.extend({
  model({app_id}){
    return this.get('store').peekRecord('project', app_id);
  }
});
