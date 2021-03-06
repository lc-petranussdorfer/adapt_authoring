/*
* BuilderView - base class for all views
* License - http://github.com/adaptlearning/adapt_authoring/LICENSE
* Maintainers - Brian Quinn <brian@learningpool.com>
*/
define(function(require){

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var OriginView = Backbone.View.extend({

    settings: {
      autoRender: true,
      preferencesKey: ''
    },

    initialize: function(options) {
      this.preRender(options);
      if (this.settings.autoRender) {
        this.render();
      }
      this.listenTo(Origin, 'remove:views', this.remove);
    },

    preRender: function() {},

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      _.defer(_.bind(function() {
        this.postRender();
        this.onReady();
      }, this));
      return this;
    },

    postRender: function() {},

    onReady: function() {},

    setViewToReady: function() {
      Origin.trigger('router:hideLoading');
    },

    setUserPreference: function(key, value) {
      if (this.settings.preferencesKey && typeof(Storage) !== "undefined") {
        // Get preferences for this view
        var preferences = localStorage.getItem(this.settings.preferencesKey);
        // Convert string to JSON
        var json = (JSON.parse(preferences) || {});
        // Set key and value
        json[key] = value;
        // Store in localStorage
        localStorage.setItem(this.settings.preferencesKey, JSON.stringify(json));
        
      }
    },

    getUserPreferences: function() {
      if (this.settings.preferencesKey && typeof(Storage) !== "undefined"
        && localStorage.getItem(this.settings.preferencesKey)) {
        return JSON.parse(localStorage.getItem(this.settings.preferencesKey));
      } else {
        return {};
      }
    },

    sortArrayByKey: function (arr, key) {
      return arr.sort(function(a, b){
        var keyA = a[key],
        keyB = b[key];
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
      });
    }

  });

  return OriginView;

});
