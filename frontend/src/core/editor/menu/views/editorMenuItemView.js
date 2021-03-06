define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorMenuItemView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu-item",

    events: {
        'click .editor-menu-item-inner'       : 'onMenuItemClicked',
        'click a.open-context-contentObject'  : 'openContextMenu',
        'click a.contentObject-delete'        : 'deleteItemPrompt'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorMenuView:removeMenuViews', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorView:removeItem:'+ this.model.get('_id'), this.deleteItem);
      this.listenTo(Origin, 'editorView:cancelRemoveItem:'+ this.model.get('_id'), this.cancelDeleteItem);

      // Listen to _isSelected change to see if we should setup keyboard events
      this.listenTo(this.model, 'change:_isSelected', this.handleKeyEventsSetup);

      // Trigger initial setup of keyboard events as change is fired on init
      this.handleKeyEventsSetup(this.model, this.model.get('_isSelected'));

      // Handle the context menu clicks
      this.on('contextMenu:menu:edit', this.editMenuItem);
      this.on('contextMenu:menu:copy', this.copyMenuItem);
      this.on('contextMenu:menu:delete', this.deleteItemPrompt);

      this.on('contextMenu:page:edit', this.editMenuItem);
      this.on('contextMenu:page:copy', this.copyMenuItem);
      this.on('contextMenu:page:delete', this.deleteItemPrompt);

      this.setupClasses();
      
    },

    copyMenuItem: function() {
      $('.paste-zone').removeClass('visibility-hidden');
      Origin.trigger('editorView:copy', this.model);
    },

    onMenuItemClicked: function(event) {
      // Boo - jQuery doesn't allow dblclick and single click on the same element
      // time for a timer timing clicks against time delay
      var delay = 300;
      var timer = null;
      // Needing to store this on the model as global variables
      // cause an issue that double click loses scope
      var clicks = this.model.get('clicks');
      this.model.set('clicks', clicks ? clicks : 0);

      var currentClicks = this.model.get('clicks') + 1;
      this.model.set('clicks', currentClicks);
      // No matter what type of click - select the item straight away
      this.setItemAsSelected();

      if(currentClicks === 1) {

        timer = setTimeout(_.bind(function() {

          this.model.set('clicks', 0);

        }, this), delay);

      } else if (currentClicks === 2) {

        clearTimeout(timer);
        // Only if the current double clicked it is a page item
        if (this.model.get('_type') == 'page') {
          this.gotoPageEditor();
        }
        this.model.set('clicks', 0);
      }
        
    },

    onMenuItemDblClicked: function(event) {
      event.preventDefault();
    },

    gotoPageEditor: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/page/' + this.model.get('_id'), {trigger:true});
    },

    setItemAsSelected: function() {
      this.model.set({'_isSelected': true});
      this.model.set({'_isExpanded' : (this.model.get('_type') === 'menu' ? true : false)})

      this.showEditorSidebar();
      this.setParentSelectedState();
      this.setSiblingsSelectedState();
      this.setChildrenSelectedState();

      Origin.trigger('editorView:storeSelectedItem', this.model.get('_id'));
    },

    showEditorSidebar: function() {
      Origin.trigger('editorSidebarView:addEditView', this.model);
    },

    setupClasses: function() {
      var classString = '';
      if (this.model.get('_isSelected')) {
        classString += 'selected ';
      }
      if (this.model.get('_isExpanded')) {
        classString += 'expanded ';
      }
      classString += ('content-type-'+this.model.get('_type'));
      
      this.$el.addClass(classString);
    },

    setParentSelectedState: function() {
      this.model.getParent().set('_isSelected', false);
    },

    setSiblingsSelectedState: function() {
      this.model.getSiblings().each(function(sibling) {
        sibling.set({'_isSelected': false, '_isExpanded': false});
      });
    },

    setChildrenSelectedState: function() {
      this.model.getChildren().each(function(child) {
        child.set({'_isSelected': false, '_isExpanded': false});
      })
    },

    editMenuItem: function() {
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var menuItemId = this.model.get('_id');
      Origin.router.navigate('#/editor/' 
        + courseId 
        + '/' 
        + type 
        + '/' 
        + menuItemId 
        + '/edit', {trigger: true});
    },

    deleteItemPrompt: function(event) {
      if (event) {
        event.preventDefault();
      }
      var id = this.model.get('_id');
      var deleteItem = {
          _type: 'prompt',
          _showIcon: true,
          title: window.polyglot.t('app.deleteitem'+ this.model.get('_type')),
          body: window.polyglot.t('app.confirmdelete' + this.model.get('_type')) + '<br />' + '<br />' + window.polyglot.t('app.confirmdeletewarning'+ this.model.get('_type')),
          _prompts: [
            {_callbackEvent: 'editorView:removeItem:' + id, promptText: window.polyglot.t('app.ok')},
            {_callbackEvent: 'editorView:cancelRemoveItem:' + id, promptText: window.polyglot.t('app.cancel')}
          ]
        };

      Origin.trigger('notify:prompt', deleteItem);
    },


    deleteItem: function(event) {
      // When deleting an item - the parent needs to be selected
      this.model.getParent().set({_isSelected:true});
      if (this.model.destroy()) {
        this.remove();
      }
    },

    cancelDeleteItem: function() {
        this.model.set({_isSelected: true});
    },

    handleKeyEventsSetup: function(model, isSelected) {
      // This is used to toggle between _isSelected on the model and 
      // setting up the events for the keyboard
      if (!isSelected) {
        this.stopListening(Origin, 'key:down', this.handleKeyEvents);
      } else {
        this.listenTo(Origin, 'key:down', this.handleKeyEvents);
      }
    },

    handleKeyEvents: function(event) {
      // Check if it's the backspace button
      if (event.which === 8) {
        event.preventDefault();
        this.model.set({_isSelected: false});
        this.deleteItemPrompt();
      }

      // Check it it's the enter key
      if (event.which === 13) {
        this.onMenuItemClicked();
      }
      
    }
    
  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
