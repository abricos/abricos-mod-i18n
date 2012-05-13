/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	comp:[
        {name: '{C#MODNAME}', files: ['lib.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var CE = YAHOO.util.CustomEvent;
	
	var buildTemplate = this.buildTemplate;

	var elChildForeach = function(el, callback){
		NS.life(callback, el);
		
		var els = el.childNodes;
		for (var i=0;i<els.length;i++){
			elChildForeach(els[i], callback);
		}
	};

	var SrvComponentRowWidget = function(container, component, cfg){
		cfg = cfg || {};
		this.init(container, component, cfg);
	};
	SrvComponentRowWidget.prototype = {
		init: function(container, comp, cfg){
			this.component = comp;
			this.selected = false;
			this.cfg = cfg;
			
			var TM = buildTemplate(this, 'row'),
				div = document.createElement('div');

			div.innerHTML = TM.replace('row', {
				'id': comp.id
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
			var TM = this._TM, 
				gel = function(n){return TM.getEl('row.'+n);},
				comp = this.component;
			gel('tl').innerHTML = comp.name;
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
	NS.SrvComponentRowWidget = SrvComponentRowWidget;
	
	var SrvComponentListWidget = function(container, module){
		this.init(container, module);
	};
	SrvComponentListWidget.prototype = {
		init: function(container, module){
			this.selectedJSComponent = null;
			this.selectChangedEvent = new CE('selectChangedEvent');
			this.ws = [];

			var TM = buildTemplate(this, 'widget');
			container.innerHTML = TM.replace('widget');

			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
			this.setModule(module);
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
		selectJSComponent: function(component){
			this.selectJSComponentById(component.id);
		},
		selectJSComponentById: function(componentid){
			var reta = null;
			for (var i=0;i<this.ws.length;i++){
				var w = this.ws[i];
				if (w.component.id == componentid){
					reta = w.component;
					w.select();
				}else{
					w.unSelect();
				}
			}
			this.selectedJSComponent = reta;
			this.onSelectJSComponent(reta);
			return reta;
		},
		onSelectJSComponent: function(comp){
			this.selectChangedEvent.fire(comp);
		},
		onSelectByClick: function(row){
			this.selectJSComponent(row.component)
		},
		renderJSComponent: function(comp){
			var __self = this,
				w = new NS.SrvComponentRowWidget(this._TM.getEl('widget.list'), comp, {
					'onSelCallback': function(row){
						__self.onSelectByClick(row);
					}
				}
			);
			this.ws[this.ws.length] = w;
			return w;
		},
		setModule: function(mod){
			this.clearws();
			
			var TM = this._TM, __self = this;
			TM.getEl('widget.mtl').innerHTML = mod.name;
			
			mod.jsComponents.foreach(function(comp){
				__self.renderJSComponent(comp);
			});
		}
	};
	NS.SrvComponentListWidget = SrvComponentListWidget;

};