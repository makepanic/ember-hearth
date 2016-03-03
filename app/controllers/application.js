import Ember from 'ember';

const {inject} = Ember;

export default Ember.Controller.extend({
  ipc: inject.service(),
  electron: inject.service(),

  model: [],

  init(){
    this._super(...arguments);

    let store = this.get('store');

    this.get('ipc').on('project-list', (ev, data) => {
      const projectInStore = this.store.peekAll('project').get('length') === 1;
      this.get('store').pushPayload('project', data);
      if (!projectInStore) {
        // TODO: prettier, currently only redirect if no project in store
        this.transitionToRoute('detail', this.store.peekRecord('project', data.data[0].id));
      }
    });

    this.get('ipc').on('cmd-start', (ev, {cmd}) => {
      this.get('store').peekRecord('command', cmd.id)
        .set('running', true);
    });
    this.get('ipc').on('cmd-stdout', (ev, {cmd, stdout}) => {
      this.get('store').peekRecord('command', cmd.id)
        .get('stdout').pushObject(stdout);
    });
    this.get('ipc').on('cmd-stderr', (ev, {cmd, stderr}) => {
      this.get('store').peekRecord('command', cmd.id)
        .get('stderr').pushObject(stderr);
    });

    this.get('ipc').on('cmd-close', (ev, {cmd, code}) => {
      let command = this.get('store').peekRecord('command', cmd.id);
      command.set('running', false);
      if (code === 0) {
        command.set('succeeded', true);
        command.onSucceed();
      } else {
        command.set('failed', true);
        command.onFail();
      }
    });
  }
});
