import Ember from 'ember';

const {inject} = Ember;

export default Ember.Controller.extend({
  ipc: inject.service(),
  electron: inject.service(),

  model: [],

  init(){
    this._super(...arguments);

    this.get('ipc').on('app-list', (ev, data) => {
      this.get('store').pushPayload('project', data);
    });

    this.get('ipc').on('app-start', (ev, data) => {
      let project = this.get('store').peekRecord('project', data.id);
      project.set('running', true);
    });
    this.get('ipc').on('app-close', (ev, data) => {
      let project = this.get('store').peekRecord('project', data.id);
      project.set('running', false);
    });

    this.get('ipc').trigger('hearth-ready');
  },

  actions: {
    addApp(){
      let dialog = this.get('electron.remote.dialog'),
        dirs = dialog.showOpenDialog({properties: ['openDirectory']});

      if (dirs.length) {
        this.get('ipc').trigger('hearth-add-app', dirs[0]);
      }
    }
  }
});
