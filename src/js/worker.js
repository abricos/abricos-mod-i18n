var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['moduleList.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.WorkerWidget = Y.Base.create('workerWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.reloadData();
        },
        reloadData: function(){
            this.set('waiting', true);

            this.get('appInstance').fullData(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('configData', result.configData);
                }
                this.onLoadData();
            }, this);
        },
        onLoadData: function(){
            var tp = this.template;

            this.moduleListWidget = new NS.ModuleListWidget({
                boundingBox: tp.gel('moduleList')
            });
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            configData: {value: null}
        }
    });

};

