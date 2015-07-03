var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['application.js', 'form.js']},
        {name: '{C#MODNAME}', files: ['model.js']}
    ]
};
Component.entryPoint = function(NS){

    var COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.roles = new Brick.AppRoles('{C#MODNAME}', {
        isView: 10,
        isWrite: 30,
        isAdmin: 50
    });

    NS.URL = {
        ws: "#app={C#MODNAMEURI}/wspace/ws/",
        worker: function(){
            return NS.URL.ws + 'worker/WorkerWidget/';
        },
        config: function(){
            return NS.URL.ws + 'configEditor/ConfigEditorWidget/';
        },
        template: function(module, type, name){
            return NS.URL.ws + 'template/TemplateEditorWidget/' + module + '/' + type + '/' + name + '/';
        }
    };

    SYS.Application.build(COMPONENT, {
        configData: {
            cache: 'configData',
            response: function(d){
                return new NS.ConfigData(d);
            }
        },
        configSave: {
            args: ['configData']
        },
        project: {
            cache: 'project',
            response: function(d){
                return new NS.Project(d);
            }
        },
        template: {
            args: ['module', 'type', 'name'],
            response: function(d){
                return new NS.Template(d);
            }
        }

    }, {
        initializer: function(){
            this.initCallbackFire();
        },
        fullData: function(callback, context){
            var cache = this._appCache;
            if (cache.configData
                && cache.project){
                return callback.apply(context, [null, cache]);
            }
            this.ajaxa({'do': 'fullData'}, callback, context);

        }
    });

    var L = YAHOO.lang,
        R = NS.roles;

    NS.lif = function(f){
        return L.isFunction(f) ? f : function(){
        };
    };
    NS.life = function(f, p1, p2, p3, p4, p5, p6, p7){
        f = NS.lif(f);
        f(p1, p2, p3, p4, p5, p6, p7);
    };

    NS.getSelectionText = function(){
        var selText = "";
        if (document.getSelection){ // firefox
            selText = document.getSelection();
        } else if (document.selection){ // ie
            selText = document.selection.createRange().text;
        } else if (window.getSelection){ // Safari
            selText = window.getSelection();
        }
        return selText + "";
    };

    NS.getSelectionTextArea = function(el){
        if (document.selection){ // ie
            el.focus();
            return document.selection.createRange().text;
        } else if (el.selectionStart || el.selectionStart == '0'){ // firefox, opera
            return el.value.substr(el.selectionStart, el.selectionEnd - el.selectionStart);
        }
        return '';
    };

    NS.replaceSelectionTextArea = function(el, text){
        el.focus();

        if (document.selection){
            var s = document.selection.createRange();
            if (s.text){
                s.text = text;
                return true;
            }
        } else if (typeof(el.selectionStart) == "number"){
            if (el.selectionStart != el.selectionEnd){
                var start = el.selectionStart,
                    end = el.selectionEnd;
                el.value = el.value.substr(0, start) + text + el.value.substr(end);
            }
            return true;
        }
        return false;
    };


    var I18nManager = function(callback){
        this.init(callback);
    };
    I18nManager.prototype = {
        init: function(callback){

            this.modules = new NS.ModuleList();

            this.languages = {};

            var __self = this;
            R.load(function(){
                var sd = {
                    'do': 'init'
                };
                __self.ajax(sd, function(data){
                    if (!L.isNull(data)){
                        __self._updateBoardData(data);
                    }
                    NS.i18nManager = __self;
                    NS.life(callback, __self);
                });
            });
        },
        ajax: function(data, callback){
            data = data || {};
            data['tm'] = Math.round((new Date().getTime()) / 1000);

            Brick.ajax('{C#MODNAME}', {
                'data': data,
                'event': function(request){
                    NS.life(callback, request.data);
                }
            });
        },
        _updateBoardData: function(d){
            if (L.isNull(d)){
                return;
            }

            var a = (d['langs'] || '').replace(/\r/gi, '').split('\n');
            for (var i = 0; i < a.length; i++){
                var s = a[i].split(':');
                this.languages[s[0]] = s[1];
            }

            var ms = Brick.Modules, list = [];

            for (var n in ms){
                var mod = new NS.Module({'id': n, 'nm': n});

                for (var i = 0; i < ms[n].length; i++){
                    var comp = new NS.JSComponent(ms[n][i]);
                    comp.module = mod;
                    mod.jsComponents.add(comp);
                }
                list[list.length] = mod;
            }

            list = list.sort(function(m1, m2){
                if (m1.name > m2.name){
                    return 1;
                }
                if (m1.name < m2.name){
                    return -1;
                }
                return 0;
            });
            for (var i = 0; i < list.length; i++){
                this.modules.add(list[i]);
            }

            // серверные компоненты
            for (var n in d['srv']){
                var mod = this.modules.get(n);
                if (L.isNull(mod)){
                    mod = new Module({'id': n, 'nm': n});
                }
                var mis = d['srv'][n];
                for (var i = 0; i < mis.length; i++){

                    var comp = new NS.SrvComponent(mis[i]);
                    comp.module = mod;
                    mod.srvComponents.add(comp);
                }
            }
        }
    };
    NS.I18nManager = I18nManager;
    NS.i18nManager = null;

    NS.initI18nManager = function(callback){
        if (L.isNull(NS.i18nManager)){
            NS.i18nManager = new I18nManager(callback);
        } else {
            NS.life(callback, NS.i18nManager);
        }
    };

    var WS = "#app={C#MODNAMEURI}/wspace/ws/";
    NS.navigator = {
        'ws': WS,
        'about': WS + 'about/AboutWidget/',
        'module': {
            'view': function(modid){
                return WS + 'modview/ModuleViewWidget/' + modid + '/';
            }
        }
    };
};