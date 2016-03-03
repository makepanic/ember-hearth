import Ember from 'ember';
//let electron = requireNode('electron');

const {RSVP, Evented, run} = Ember;
const {CONNECTING, OPEN, CLOSING, CLOSED} = WebSocket;

export default Ember.Service.extend(Evented, {
  init(){
    this._super(...arguments);
    this._ws = new WebSocket("ws://localhost:9001");

    this._ws_on = {};
    this._ws.onmessage = (ev) => {
      let data = this.deserializeMessage(ev.data);
      if (this._ws_on[data.type]) {
        this._ws_on[data.type]
          .forEach(handler => handler(this._ws, data.body));
      }
    };
  },

  ready(){
    let ws = this._ws;

    return new RSVP.Promise((resolve) => {
      const i = setInterval(() => {
        if (ws.readyState === OPEN) {
          clearInterval(i);
          resolve();
        }
      }, 200);
    });
  },

  serializeMessage(type, data) {
    return JSON.stringify({type: type, body: data});
  },

  deserializeMessage(messageString) {
    let data=  JSON.parse(messageString);
    return {type: data.type, body: data.body};
  },

  on(name, target, method){
    this._super(...arguments);

    this._ws_on[name] = this._ws_on[name] || [];
    this._ws_on[name]
      .push(typeof target !== 'function' ? method.bind(target) : target);
  },
  trigger(name, ...args) {
    this._super(...arguments);
    this._ws.send(this.serializeMessage(name, args));
  }
});
