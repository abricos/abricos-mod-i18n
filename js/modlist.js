/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['lib.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var CE = YAHOO.util.CustomEvent;
	
	var LNG = this.language,
		buildTemplate = this.buildTemplate;

	var elChildForeach = function(el, callback){
		NS.life(callback, el);
		
		var els = el.childNodes;
		for (var i=0;i<els.length;i++){
			elChildForeach(els[i], callback);
		}
	};

	var ModuleRowWidget = function(container, module, cfg){
		cfg = cfg || {};
		this.init(container, module, cfg);
	};
	ModuleRowWidget.prototype = {
		init: function(container, mod, cfg){
			this.module = mod;
			this.selected = false;
			this.cfg = cfg;
			
			var TM = buildTemplate(this, 'row'),
				div = document.createElement('div');

			div.innerHTML = TM.replace('row', {
				'id': mod.id
			});
			container.appendChild(div.childNodes[0]);
			
			this.render();
		},
		destroy: function(){
			var el = this._TM.getEl('row.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			var tp = this._TId['row'];
			
			var TM = this._TM, findClick = false;
			
			elChildForeach(TM.getEl('row.id'), function(fel){
				if (fel == el){ findClick = true; }
			});
			if (findClick){
				this.onSelectByClick(); return true;				
			}
			return false;
		},
		render: function(){
			var TM = this._TM, gel = function(n){return TM.getEl('row.'+n);};
				mod = this.module;
			gel('tl').innerHTML = mod.name;
		},
		onSelectByClick: function(){
			NS.life(this.cfg['onSelCallback'], this);
		},
		select: function(){
			this.selected = true;
			this.renderSelStatus();
		},
		unSelect: function(){
			this.selected = false; 
			this.renderSelStatus();
		},
		renderSelStatus: function(){
			var TM = this._TM;
			if (this.selected){
				Dom.addClass(TM.getEl('row.sel'), 'sel');
			}else{
				Dom.removeClass(TM.getEl('row.sel'), 'sel');
			}
		}
	};
	NS.ModuleRowWidget = ModuleRowWidget;
	
	var ModuleListWidget = function(container){
		this.init(container);
	};
	ModuleListWidget.prototype = {
		init: function(container){

			this.selectedModule = null;
			this.selectChangedEvent = new CE('selectChangedEvent');
			this.ws = [];

			var TM = buildTemplate(this, 'widget');
			container.innerHTML = TM.replace('widget');

			var __self = this;

			NS.localizeManager.modules.foreach(function(mod){
				__self.renderModule(mod);
			});

			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		destroy: function(){
			this.clearws();
			var el = this._TM.getEl('widget.id');
			el.parentNode.removeChild(el);
		},
		clearws: function(){
			for (var i=0;i<this.ws.length;i++){
				this.ws[i].destroy();
			}
			this.ws = [];
		},
		onClick: function(el){
			for (var i=0;i<this.ws.length;i++){
				if(this.ws[i].onClick(el)){ return true; }
			}
			return false;
		},
		selectModule: function(module){
			this.selectModuleById(module.id);
		},
		selectModuleById: function(moduleid){
			var reta = null;
			for (var i=0;i<this.ws.length;i++){
				var w = this.ws[i];
				if (w.module.id == moduleid){
					reta = w.module;
					w.select();
				}else{
					w.unSelect();
				}
			}
			this.selectedModule = reta;
			this.onSelectModule(reta);
			return reta;
		},
		onSelectModule: function(module){
			this.selectChangedEvent.fire(module);
		},
		onSelectByClick: function(row){
			this.selectModule(row.module)
		},
		renderModule: function(mod){
			var __self = this,
				w = new NS.ModuleRowWidget(this._TM.getEl('widget.list'), mod, {
					'onSelCallback': function(row){
						__self.onSelectByClick(row);
					}
				}
			);
			this.ws[this.ws.length] = w;
			return w;
		}
	};
	NS.ModuleListWidget = ModuleListWidget;

};