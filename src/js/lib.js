/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: 'sys', files: ['item.js','number.js']},
        {name: 'uprofile', files: ['lib.js']},
        {name: '{C#MODNAME}', files: ['roles.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		L = YAHOO.lang,
		R = NS.roles;

	var CE = YAHOO.util.CustomEvent;
	var SysNS = Brick.mod.sys;
	var LNG = this.i18n;

	this.buildTemplate({}, '');
	
	NS.lif = function(f){return L.isFunction(f) ? f : function(){}; };
	NS.life = function(f, p1, p2, p3, p4, p5, p6, p7){
		f = NS.lif(f); f(p1, p2, p3, p4, p5, p6, p7);
	};
	NS.Item = SysNS.Item;
	NS.ItemList = SysNS.ItemList;
	
	NS.getSelectionText = function(){
		var selText = "";
	    if (document.getSelection) { // firefox
	        selText = document.getSelection();
	    } else if (document.selection) { // ie
	        selText = document.selection.createRange().text;
	    } else if (window.getSelection) { // Safari
	        selText = window.getSelection();
	    }
	    return selText+"";
	};
	
	NS.getSelectionTextArea = function(el){
		if (document.selection) { // ie
			el.focus();  
			return document.selection.createRange().text;  
		} else if (el.selectionStart || el.selectionStart == '0') { // firefox, opera  
			return el.value.substr(el.selectionStart, el.selectionEnd-el.selectionStart);
		} 
		return '';
	};
	
	NS.replaceSelectionTextArea = function(el, text){
		el.focus();
		 
		if (document.selection){
			var s = document.selection.createRange();
			if (s.text){
				s.text=text;
				return true;
			}
		} else if (typeof(el.selectionStart)=="number") {
			if (el.selectionStart!=el.selectionEnd) {
				var start = el.selectionStart,
					end = el.selectionEnd;
				el.value = el.value.substr(0,start)+text+el.value.substr(end);
			}
			return true;
		}
		return false;
	};
	
	
	var Phrase = function(id, d, parent){
		this.init(id, d, parent);
	};
	Phrase.prototype = {
		init: function(id, d, parent){
			if (!id){
				this.isnew = true;
			}
			this.id = id || '';
			this.title = '';
			
			this.parent = parent || null;
			this.childs = null;
			
			// статус: ''-оригинал, 'n'-новая, 'u'-обновлена, 'd'-удалена
			this.status = '';
			
			if (L.isObject(d)){
				var childs = [];
				for (var n in d){
					childs[childs.length] = new Phrase(n, d[n], this);
				}
				this.childs = childs;
			}else if (L.isString(d)){
				this.title = d;
			}
		},
		isContainer: function(){
			return !L.isNull(this.childs);
		},
		remove: function(){
			this.status = 'd';
		},
		update: function(id, title){
			this.id = id;
			if (!this.isContainer()){
				this.title = title;
			}
			if (this.status == 'n'){ return; }
			this.status = 'u';
		},
		foreach: function(f, full){
			var chs = this.childs;
			if (!L.isFunction(f) || !L.isArray(chs)){ return; }
			for (var i=0, ph; i<chs.length; i++){
				ph = chs[i];
				if (f(ph)){ return; }
				if (full){
					ph.foreach(f, full);
				}
			}
		},
		findChild: function(id){
			var chs = this.childs;
			if (L.isNull(chs)){ return null; }
			for (var i=0;i<chs.length;i++){
				if (chs[i].id == id){ return chs[i]; }
			}
			return null;
		},
		addChild: function(child){
			if (L.isNull(this.childs)){
				this.childs = [];
			}
			this.childs[this.childs.length] = child;
			child.parent = this;
		},
		createPhrase: function(path, sText){
			var pa = path.split('.');
			if (pa.length == 0){ return null; }
			
			var id = pa[0], ph = this.findChild(id);
			
			if (pa.length == 1){
				if (!L.isNull(ph)){
					// нельзя создать фразы с одинаковым идентификатором
					return null;
				}
				ph = new Phrase(id, sText, this);
				ph.status = 'n';
				this.addChild(ph);
				return ph;
			}
			
			var npa = [];
			for (var i=1;i<pa.length;i++){
				npa[npa.length] = pa[i];
			}
			var npath = npa.join('.');
			
			if (L.isNull(ph)){
				ph = new Phrase(id, null, this);
				ph.status = 'n';
				this.addChild(ph);
			}
			return ph.createPhrase(npath, sText);
		},
		getTemplateId: function(comp){
			var mname = comp.module.name;
			var id = this.id+"", p = this.parent;
			
			if (!L.isNull(p.parent)){
				while(!L.isNull(p)){
					id = (p.id+"")+'.'+id;
					p = p.parent;
					if (L.isNull(p.parent)){ break; }
				}
			}
			if (comp.type == "js"){
				return "{#mod."+mname+"."+id+"}";
			}else{
				return "{#"+id+"}";
			}
		},
		getSaveData: function(){
			var r = {
				'id': this.id,
				'tl': this.title
			};
			var chs = [];
			this.foreach(function(ch){
				if (ch.status == 'd'){ return; }
				chs[chs.length] = ch.getSaveData();
			});
			if (chs.length > 0){
				r['chs'] = chs;
			}
			return r;
		}
	};
	NS.Phrase = Phrase;
	
	NS.Phrase.generateChildId = function(ph){
		if (L.isNull(ph)){ return ''; }
		if (L.isNull(ph.childs)){ return '1'; }
		
		var maxid = 1;
		for (var i=0, id, nid; i<ph.childs.length; i++){
			id = ph.childs[i].id;
			nid = id*1;
			if (nid>0 && id+''==nid+''){
				maxid = Math.max(nid, maxid);
			}
		}
		return (maxid+1)+'';
	};
	
	var Component = function(d){
		d = d || {};
		Component.superclass.constructor.call(this, d);
	};
	YAHOO.extend(Component, NS.Item, {
		init: function(d){
			
			this.module = null;
			this.phrases = {};
			this.template = null;
			
			Component.superclass.init.call(this, d);
		},
		setPhrases: function(lngid, ds, revs){
			for (var fname in ds){
				var ph = new Phrase(lngid, ds[fname]);
				ph.revision = revs[fname] || 0;
				this.phrases[lngid] = ph;
			}
		},
		getPhrases: function(lngid){
			var ph = this.phrases[lngid];
			if (!ph){
				this.phrases[lngid] = ph = new Phrase(lngid);
				ph.status = 'n';
			}
			return ph;
		},
		createPhrase: function(lngid, path, sText){
			var fph = this.findPhrase(lngid, path);
			if (!L.isNull(fph)){
				// нельзя создать фразы с одинаковым идентификатором
				return null;
			}
			
			if (!this.phrases[lngid]){
				this.phrases[lngid] = new Phrase(lngid);
			}
			var ph = this.phrases[lngid].createPhrase(path, sText);
			
			return ph;
		},
		findPhrase: function(lngid, path){
			var ph = this.phrases[lngid];
			if (!ph){ return null; }
			
			var ap = path.split('.');
			for (var i=0; i<ap.length;i++){
				var ch = ph.findChild(ap[i]);
				if (L.isNull(ch)){ return null; }
				ph = ch;
			}
			return ph;
		},
		_updateTemplate: function(text){
			this.template = text;
			this.templateorig = text;
		},
		isChange: function(){
			if (this.template != this.templateorig){
				return true;
			}
			var change = false;
			for (var n in this.phrases){
				var phlng = this.phrases[n];
				phlng.foreach(function(ph){
					if (ph.status != ''){
						change = true;
						return true;
					}
				}, true);
				if (phlng.status != ''){ 
					return true;
				}
			}
			return change;
		},
		_updateData: function(d){
			if (L.isNull(d)){ return; }
			if (!d['template']['error']){
				this._updateTemplate(d['template']['text']);
			}
			if (!d['language']['error']){
				if (this.type == 'js'){
					this.module._updateJSLangData(d['language']['text']);
				}else{
					this.module._updateSrvLangData(d['language']['text']);
				}
			}
		},
		_loadTemplateMethod: function(odo, callback){
			if (L.isString(this.template)){
				NS.life(callback, this.template);
				return;
			}
			
			odo = L.merge({
				'module': this.module.name,
				'component': this.name,
				'type': this.type
			}, odo || {}); 
			
			var __self = this;
			NS.i18nManager.ajax(odo, function(d){
				if (!L.isNull(d)){
					__self._updateTemplate(d);
				}
				NS.life(callback, d);
			});
		},
		_saveChangesMethod: function(act, callback){
			var lngs = {};
			for (var n in this.phrases){
				lngs[n] = this.phrases[n].getSaveData();
			}
			
			var sd = {
				'do': act,
				'module': this.module.name,
				'component': this.name,
				'type': this.type,
				'template': this.template,
				'language': lngs
			};
			
			var __self = this;
			NS.i18nManager.ajax(sd, function(d){
				__self._updateData(d);
				NS.life(callback, d);
			});
		},
		_revertChangesMethod: function(act, callback){
			var __self = this;
			var sd = {
				'do': act,
				'module': this.module.name,
				'component': this.name
			};

			NS.i18nManager.ajax(sd, function(d){
				__self._updateData(d);
				NS.life(callback, d);
			});
		},
		getId: function(){ return this._id; }
		
	});
	NS.Component = Component;
	
	var JSComponent = function(d){
		d = L.merge({
			'f': '',
			'k': ''
		}, d || {});
		JSComponent.superclass.constructor.call(this, d);
	};
	YAHOO.extend(JSComponent, Component, {
		update: function(d){
			this.id = this.name = d['f'].replace('.js', '');
			this.key = d['k'];
			
			this.type = "js";
		},
		loadTemplate: function(callback){
			this._loadTemplateMethod({
				'do': 'jstemplate'
			}, callback);
		},
		saveChanges: function(callback){
			this._saveChangesMethod('jscompsave', callback);
		},
		revertChanges: function(callback){
			this._revertChangesMethod('jscompload', callback);
		}
	});
	NS.JSComponent = JSComponent;
	
	var SrvComponent = function(d){
		d = L.merge({
			'nm': '',
			'tp': ''
		}, d || {});
		SrvComponent.superclass.constructor.call(this, d);
	};
	YAHOO.extend(SrvComponent, Component, {
		update: function(d){
			this.type = d['tp'] == 'b' ? 'brick' : 'content';
			this.name = d['nm'];
			this.id = this.getId();
		},
		getId: function(){
			return this.type+'-'+this.name;
		},
		loadTemplate: function(callback){
			this._loadTemplateMethod({
				'do': 'srvtemplate',
				'type': this.type
			}, callback);
		},
		saveChanges: function(callback){
			this._saveChangesMethod('srvcompsave', callback);
		},
		revertChanges: function(callback){
			this._revertChangesMethod('srvcompload', callback);
		}
	});
	NS.SrvComponent = SrvComponent;

	
	var ComponentList = function(d){
		ComponentList.superclass.constructor.call(this, d);
	};
	YAHOO.extend(ComponentList, NS.ItemList, {});
	NS.ComponentList = ComponentList;
	NS.JSComponentList = ComponentList;
	
	var Module = function(d){
		d = L.merge({
			'nm': ''
		}, d || {});
		Module.superclass.constructor.call(this, d);
	};
	YAHOO.extend(Module, NS.Item, {
		init: function(d){
			
			this.srvComponents = new ComponentList();
			this.jsComponents = new ComponentList();
			
			this.langs = {
				'ru': 'ru',
				'en': 'en'
			};
			Module.superclass.init.call(this, d);
		},
		update: function(d){
			this.name = d['nm'];
		},
		reloadLanguageData: function(callback){
			var __self = this;
			
			NS.i18nManager.ajax({
				'do': 'language',
				'module': this.name
			}, function(d){
				if (!L.isNull(d)){
					__self._updateSrvLangData(d['srv']);
					__self._updateJSLangData(d['js']);
				}
				NS.life(callback);
			});
		},
		_updateSrvLangData: function(d){
			var phrases = {};
			for (var lng in d){
				this.langs[lng] = lng;
				var ph = new Phrase(lng, d[lng]);
				ph.revision = 0;
				phrases[lng] = ph;
			}
			this.srvComponents.foreach(function(comp){
				comp.phrases = phrases;
			});
		},
		_updateJSLangData: function(jsScript){
			NS.tempData = null;
			NS.tempDataVs = null;
			
			Brick.readScript(jsScript);

			if (!L.isObject(NS.tempData)){ return; }

			var lngs = NS.tempData[this.name] || {},
				revs = NS.tempDataVs[this.name] || {};
				
			NS.tempData = null;
			
			for (var lng in lngs){
				this.langs[lng] = lng;
				
				for (var cname in lngs[lng]){
					var comp = this.jsComponents.get(cname);
					if (!L.isNull(comp)){
						comp.setPhrases(lng, lngs[lng][cname], revs[lng][cname]);
					}
				}
			}
		}
	});
	NS.Module = Module;

	var ModuleList = function(d){
		ModuleList.superclass.constructor.call(this, d);
	};
	YAHOO.extend(ModuleList, NS.ItemList, {});
	NS.ModuleList = ModuleList;
	
	var I18nManager = function(callback){
		this.init(callback);
	};
	I18nManager.prototype = {
		init: function(callback){
			
			this.modules = new ModuleList();
			
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
			data['tm'] = Math.round((new Date().getTime())/1000);

			Brick.ajax('{C#MODNAME}', {
				'data': data,
				'event': function(request){
					NS.life(callback, request.data);
				}
			});
		},
		_updateBoardData: function(d){
			if (L.isNull(d)){ return; }
			
			var a = (d['langs'] || '').replace(/\r/gi, '').split('\n');
			for (var i=0;i<a.length;i++){
				var s = a[i].split(':');
				this.languages[s[0]] = s[1];
			}
			
			var ms = Brick.Modules, list = [];
			
			for (var n in ms){
				var mod = new Module({'id': n, 'nm': n});
				
				for (var i=0;i<ms[n].length;i++){
					var comp = new JSComponent(ms[n][i]);
					comp.module = mod;
					mod.jsComponents.add(comp);
				}
				list[list.length] = mod;
			}
			
			list = list.sort(function(m1, m2){
				if (m1.name > m2.name){ return 1; }
				if (m1.name < m2.name){ return -1; }
				return 0;
			});
			for (var i=0;i<list.length;i++){
				this.modules.add(list[i]);
			}
			
			// серверные компоненты
			for (var n in d['srv']){
				var mod = this.modules.get(n);
				if (L.isNull(mod)){
					mod = new Module({'id': n, 'nm': n});
				}
				var mis = d['srv'][n];
				for (var i=0;i<mis.length;i++){
					
					var comp = new SrvComponent(mis[i]);
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
		}else{
			NS.life(callback, NS.i18nManager);
		}
	};

	var WS = "#app={C#MODNAMEURI}/wspace/ws/";
	NS.navigator = {
		'ws': WS,
		'about': WS+'about/AboutWidget/',
		'module': {
			'view': function(modid){ return WS+'modview/ModuleViewWidget/'+modid+'/'; }
		}
	};
};