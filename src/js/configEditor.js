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

    NS.ConfigEditorWidget = Y.Base.create('configEditorWidget', SYS.AppWidget, [
        SYS.Form,
        SYS.FormAction
    ], {
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);
            this.get('appInstance').fullData(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('model', result.configData);
                }
            }, this);
        },
        onSubmitFormAction: function(){
            this.set('waiting', true);

            var model = this.get('model');

            this.get('appInstance').configSave(model, function(err, result){
                this.set('waiting', false);
            }, this);
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget'
            }
        }
    });
};

