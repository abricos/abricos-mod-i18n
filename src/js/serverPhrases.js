var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.ServerPhrasesWidget = Y.Base.create('serverPhrasesWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.renderPhrases();
        },
        renderPhrases: function(){
            var tp = this.template,
                configData = this.get('configData'),
                phrases = this.get('phrases'),
                locales = configData.get('locales'),
                lstLocale = "";

            for (var locale in locales){
                lstLocale += tp.replace('option', {
                    'id': locale,
                    'val': locales[locale]
                });
            }

            Y.one(tp.gel('locales')).setHTML(
                tp.replace('select', {'rows': lstLocale})
            );
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget,table,row,select,option'
            },
            phrases: {value: []},
            configData: {value: null}
        }
    });


};

