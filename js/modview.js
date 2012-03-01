/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2012 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['jscomplist.js', 'jscompview.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var buildTemplate = this.buildTemplate;
	
	var ModuleViewWidget = function(container, mod){
		this.init(container, mod);
	};
	ModuleViewWidget.prototype = {
		init: function(container, mod){
			var TM = buildTemplate(this, 'widget');
			container.innerHTML = TM.replace('widget');
			
			this.jsCompListWidget = null;
			this.jsCompViewWidget = null;

			this.setModule(mod);
		},
		destroy: function(){
			if (!L.isNull(this.jsCompListWidget)){
				this.jsCompListWidget.destroy();
			}
			var el = this._TM.getEl('widget.id');
			el.parentNode.removeChild(el);
		},
		setModule: function(mod){
			if (this.module == mod){ return; }
			this.module = mod;
			
			var TM = this._TM, gel = function(n){ return TM.getEl('widget.'+n);},
			show = function(n){ Dom.setStyle(gel(n), 'display', ''); },
			hide = function(n){ Dom.setStyle(gel(n), 'display', 'none'); };
			
			if (L.isNull(mod)){
				show('empty'); hide('loading'); hide('wcont');
				return;
			}
			
			hide('empty'); show('loading'); hide('wcont');
			
			var __self = this;
			mod.reloadLanguageData(function(){
				__self._onLoadModuleData();
				hide('loading'); show('wcont');
			});
		},
		_onLoadModuleData: function(){
			var mod = this.module;
			var TM = this._TM, gel = function(n){ return TM.getEl('widget.'+n);};
			
			if (!L.isNull(this.jsCompListWidget)){
				this.jsCompListWidget.destroy();
				this.jsCompListWidget.selectChangedEvent.unsubscribe(this.onJSComponentSelectChanged);
			}

			this.jsCompListWidget = new NS.JSComponentListWidget(gel('jscplist'), mod);
			this.jsCompListWidget.selectChangedEvent.subscribe(this.onJSComponentSelectChanged, this, true);
			
			var comp = mod.jsComponents.getByIndex(0);
			
			if (L.isNull(this.jsCompViewWidget)){
				this.jsCompViewWidget = new NS.JSComponentViewWidget(gel('jscpview'), comp);
			}

			if (L.isNull(comp)){
				this.jsCompViewWidget.setComponent(comp);
			}else{
				// потому что событие потом вызовет this.onJSComponentSelectChanged;
				this.jsCompListWidget.selectJSComponent(comp);
			}
		},
		onJSComponentSelectChanged: function(evt, prm){
			this.jsCompViewWidget.setComponent(prm[0]);
		}
	};
	NS.ModuleViewWidget = ModuleViewWidget;

};