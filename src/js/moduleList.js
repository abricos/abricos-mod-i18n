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

    NS.ModuleListWidget = Y.Base.create('moduleListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            this.set('waiting', true);

            this.get('appInstance').project(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('project', result.project);
                }
                this.renderModuleList();
            }, this);
        },
        renderModuleList: function(){
            var moduleList = this.get('project').get('modules');
            if (!moduleList){
                return;
            }

            var tp = this.template, lst = "";

            var fillButtonsTemplate = function(attrs, buttons, type){
                attrs[type].each(function(item){
                    buttons[type] += tp.replace('button', [
                        {type: type},
                        item.getAttrs()
                    ]);
                });
            };

            moduleList.each(function(module){
                var attrs = module.getAttrs(), buttons = {
                    bricks: '', contents: '', jss: ''
                };
                fillButtonsTemplate(attrs, buttons, 'contents');
                fillButtonsTemplate(attrs, buttons, 'bricks');
                fillButtonsTemplate(attrs, buttons, 'jss');

                lst += tp.replace('row', [
                    buttons,
                    attrs
                ]);
            });

            tp.gel('list').innerHTML = tp.replace('list', {
                'rows': lst
            });
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget,list,row,button'
            },
            project: {
                value: null
            }
        }
    });
};

