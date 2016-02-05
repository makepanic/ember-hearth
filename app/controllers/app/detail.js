import Ember from 'ember';

const {inject} = Ember;

export default Ember.Controller.extend({
  ipc: inject.service(),

  actions: {
    startServer(){
      let model = this.get('model');
      this.get('ipc').trigger('hearth-start-app', model.toJSON({includeId: true}));
    },
    stopServer(){
      let model = this.get('model');
      this.get('ipc').trigger('hearth-stop-app', model.toJSON({includeId: true}));
    }
  }
});
