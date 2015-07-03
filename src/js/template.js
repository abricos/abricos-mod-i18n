var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['serverPhrases.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.TemplateEditorWidget = Y.Base.create('templateEditorWidget', SYS.AppWidget, [
    ], {
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);
            this.get('appInstance').fullData(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('configData', result.configData);
                    this.set('project', result.project);
                    this.reloadTemplateData();
                }
            }, this);
        },
        reloadTemplateData: function(){
            var moduleName = this.get('editModuleName'),
                fileType = this.get('editFileType'),
                fileName = this.get('editFileName');

            this.set('waiting', true);
            this.get('appInstance').template(moduleName, fileType, fileName, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('templateData', result.template);
                    this.onLoadTemplateData();
                }
            }, this);
        },
        onLoadTemplateData: function(){

            var templateData = this.get('templateData');

            var tp = this.template;
            var elContent = Y.one(tp.gel('content'));
            elContent.set('value', templateData.get('content'));

            this.phrasesWidget = new NS.ServerPhrasesWidget({
                boundingBox: tp.gel('phrases'),
                phrases: templateData.get('phrases'),
                configData: this.get('configData')
            });
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget'
            },
            editModuleName: {value: ''},
            editFileType: {value: ''},
            editFileName: {value: ''},
            configData: {value: null},
            project: {value: null},
            templateData: {value: null}
        }
    });

    NS.TemplateEditorWidget.parseURLParam = function(args){
        return {
            editModuleName: args[0] || '',
            editFileType: args[1] || '',
            editFileName: args[2] || ''
        };
    };

};

