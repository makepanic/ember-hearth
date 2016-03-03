import Ember from 'ember';

const {inject} = Ember;

export default Ember.Route.extend({
  electron: inject.service(),
  ipc: inject.service(),

  model(){
    const ipc = this.get('ipc');
    return ipc.ready().then(() => ipc.trigger('hearth-ready'));
  },

  actions: {
    showItemInFolder(path) {
      this.get('electron.shell').showItemInFolder(path);
    },
    openItem(path) {
      this.get('electron.shell').openItem(path);
    },
    openExternal(url){
      this.get('electron.shell').openExternal(url);
    }
  }
});
