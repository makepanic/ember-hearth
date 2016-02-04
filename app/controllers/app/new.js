import Ember from 'ember';

const {inject} = Ember;

export default Ember.Controller.extend({
  ipc: inject.service(),
  electron: inject.service(),

  path: '',
  addon: false,
  stdout: '',
  stderr: '',

  init(){
    this._super(...arguments);

    this.get('ipc').on('app-stdout', (ev, app, data) => {
      this.set('stdout', this.get('stdout') + data);
    });
    this.get('ipc').on('app-stderr', (ev, app, data) => {
      this.set('err', this.get('stdout') + data);
    });
  },

  actions: {
    setPath(){
      let dialog = this.get('electron.remote.dialog'),
        dirs = dialog.showOpenDialog({properties: ['openDirectory']});

      if (dirs.length) {
        this.set('path', dirs[0]);
      }
    },
    initProject(){
      let path = this.get('path');

      if (path) {
        this.get('ipc').trigger('hearth-init-app', {
          path: path,
          addon: false
        });
      }
    }
  }
});
