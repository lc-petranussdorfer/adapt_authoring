define(function(require) {

    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');
    var Joyride = require('joyride');

    var HelpJoyrideTour = Backbone.View.extend({

        initialize: function() {
            console.log('started');
            this.render();
        },

        render: function() {
            var template = Handlebars.templates['helpJoyrideTour'];
            $('body').append(template());
            _.defer(function() {
                $(".help-joy-ride-tour").joyride({
                    'tipLocation': 'bottom',         // 'top' or 'bottom' in relation to parent
                    'nubPosition': 'auto',           // override on a per tooltip bases
                    'scrollSpeed': 300,              // Page scrolling speed in ms
                    'timer': 2000,                   // 0 = off, all other numbers = time(ms) 
                    'startTimerOnClick': true,       // true/false to start timer on first click
                    'nextButton': true,              // true/false for next button visibility
                    'tipAnimation': 'pop',           // 'pop' or 'fade' in each tip
                    'pauseAfter': [],                // array of indexes where to pause the tour after
                    'tipAnimationFadeSpeed': 300,    // if 'fade'- speed in ms of transition
                    'cookieMonster': true,           // true/false for whether cookies are used
                    'cookieName': 'JoyRide',         // choose your own cookie name
                    'cookieDomain': false,           // set to false or yoursite.com
                    'tipContainer': 'body'
                });
            });
            
        }

    });

    return HelpJoyrideTour;

});