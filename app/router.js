import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
    this.route('detail', {path: '/:project_id'}, function() {
      this.route('statistics');
      this.route('actions');
      this.route('log');

      this.route('install', function() {
        this.route('addon');
        this.route('npm');
        this.route('bower');
      });
    });
});

export default Router;
