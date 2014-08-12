define(function(require) {

    var Origin = require('coreJS/app/origin');
    var HelpJoyrideTourView = require('coreJS/help/views/helpJoyrideTourView');

    Origin.on('dashboard:dashboardView:postRender', function() {
        console.log('weeeee');
        new HelpJoyrideTourView();

    })

});