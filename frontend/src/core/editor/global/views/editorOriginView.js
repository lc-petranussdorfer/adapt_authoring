define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var tinymce = require('tinymce');

  var EditorOriginView = OriginView.extend({
    
    dirtyFlag: false,

    events: {
      'click .paste-cancel'   : 'pasteCancel'
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      
      this.listenTo(Origin, 'editorView:pasteCancel', this.hidePasteZones);
      this.listenTo(Origin, 'editorView:navigateAway', this.checkDirtyFlag);
      var view = this;
      var allForms = view.$('form');
      // get all forms
      allForms.each(function(i,el){

        // get all formfields
        // attach onchange event
        $(el).on("change", _.bind(view.setPageDirty, view));  
      });
    },

    postRender: function() {
    },
    setPageDirty: function (e) {
      console.log('you made changes!');
      this.dirtyFlag = true;
      $(window).on("beforeunload", _.bind(this.notifyUnsavedChanges, this));  
    },
    checkDirtyFlag: function (e) {      
      return 'checkDirtyFlag return';
    },
    notifyUnsavedChanges: function () {
      // Return the text for the notification                        
      return window.polyglot.t('app.unsavedchanges');
    },
    onCopy: function(event) {
      if (event) {
        event.preventDefault();
      }

      this.showPasteZones();

      Origin.trigger('editorView:copy', this.model);
    },

    onCut: function(event) {
      if (event) {
        event.preventDefault();
      }

      Origin.trigger('editorView:cut', this);
    },

    capitalise: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    onPaste: function(event) {
      event.preventDefault();
      event.stopPropagation();

      this.hidePasteZones();

      Origin.trigger('editorView:paste', this.model.get('_parentId'), $(event.target).data('sort-order'), $(event.target).data('paste-layout'));
    },

    pasteCancel: function(event) {
      event.preventDefault();

      Origin.trigger('editorView:pasteCancel', this.model);
    },

    hidePasteZones: function() {
      // Purposeful global selector here
      $('.paste-zone').addClass('display-none');
    },

    openContextMenu: function (e) {
      e.stopPropagation();
      e.preventDefault();

      Origin.trigger('contextMenu:open', this, e);
    },

    showPasteZones: function () {
      $('.paste-zone').addClass('display-none');
      $('.paste-zone-'+ this.model.get('_type')).removeClass('display-none');
    },

    showDropZones: function () {
      // Purposeful global selector here
      $('.paste-zone').addClass('display-none');
      // Hide the links within the dropzone
      $('.paste-zone-'+ this.model.get('_type') + ' a').addClass('display-none');
      $('.paste-zone-'+ this.model.get('_type')).addClass('paste-zone-available').removeClass('display-none');
      this.$el.parent().children('.drop-only').removeClass('display-none');
    },

    hideDropZones: function() {
      // Purposeful global selectors here
      $('.paste-zone').addClass('display-none').removeClass('paste-zone-available');
      // Show the links within the dropzone again, incase copy is initiated
      $('.paste-zone a').removeClass('display-none');
      this.$el.parent().children('.drop-only').addClass('display-none')
    },

    setupTinyMCE: function(selector) {
      var elementSelector = selector;
      if (tinyMCE.editors.length > 0 ) {
        tinyMCE.editors = [];
      }
      tinyMCE.execCommand('mceFocus', false, elementSelector);
      tinyMCE.execCommand('mceRemoveControl', false, elementSelector);
      tinyMCE.baseURL = "../../core/libraries/tinymce";
      tinyMCE.init({
        mode : "exact",
        elements: elementSelector,
        menubar: false,
        contextmenu: "code | link inserttable | cell row column deletetable",
        toolbar: [
          "undo redo | styleselect | bold italic | alignleft aligncenter alignright | bullist numlist | link table | code"
        ],
        plugins: [
          "advlist autolink lists link image charmap print preview hr anchor pagebreak",
          "searchreplace wordcount visualblocks visualchars code fullscreen",
          "insertdatetime media nonbreaking save table contextmenu directionality",
          "emoticons template paste textcolor colorpicker textpattern"
        ]
      });
    },

    renderExtensionEditor: function(level) {
      // Default properties for any JSON editors on this page
      var jsonEditorDefaults = {
        no_additional_properties: true, 
        disable_array_reorder: true,
        disable_collapse: true,
        disable_edit_json: true,
        disable_properties: true
      };

      // Now check any course extensions with properties at the specified level
      var extensions = this.model.get('_extensions');

      if (extensions) {
   
        // Check which extensions are enabled on this course
        var courseExtensions = Origin.editor.data.config.get('_enabledExtensions'),
          extensionKeys = _.keys(extensions),
          enabledExtensions = _.keys(courseExtensions),
          i = 1;

        _.each(enabledExtensions, function(extension) {
          var enabledExtension = Origin.editor.data.extensionTypes.findWhere({extension: extension});
          var extensionProperites = enabledExtension.get('properties').pluginLocations.properties[level];
          // Check if the property extension properties at the specified level
          if (enabledExtension && extensionProperites && extensionProperites.properties) {
            jsonEditorDefaults.schema = extensionProperites;

            // Re-construct the 'startval' value with targetAttribute as the root property
            if (_.indexOf(extensionKeys, enabledExtension.get('targetAttribute')) > -1) {
              var value = {};

              value[enabledExtension.get('targetAttribute')] = this.model.get('_extensions')[enabledExtension.get('targetAttribute')]
              
              jsonEditorDefaults.startval = value; 
            }

            // Dynamically create a container <div>
            this.$('.' + level + '-extensions').append("<div class='" + level + "-extension-item-" + i + "'></div>");
            
            // Add a JSON editor for every enabled extension at the specified level
            this.$('.' + level + '-extension-item-' + i).jsoneditor(jsonEditorDefaults);

            // Increment the ID of the next <div>
            i++;
          }
        }, this);
      }
    },

    getExtensionJson: function(level) {
      var extensionContainers = this.$('div.' + level + '-extensions > div');
      var extensionJson = {};

      // Iterate over any extensions
      for (var i = 0; i < extensionContainers.length; i++) {
        // For some reason the jsoneditor object is very fussy with how it's referenced
        extensionJson = _.extend(this.$('.' + extensionContainers[i].className).jsoneditor('value'), extensionJson);
      }

      return extensionJson;
    },

    onReady: function() {
      var that = this;
      if (this.$('.text-editor').length > 0) {
        this.$('.text-editor').each(function() {
          var id = $(this).attr('id');
          that.setupTinyMCE(id);
        });
      }
    }

  });

  return EditorOriginView;

});
