/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2012 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['svrcomplist.js','jscomplist.js', 'compview.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var buildTemplate = this.buildTemplate;
	
	var ModuleViewWidget = function(container, modid){
		this.init(container, modid);
	};
	ModuleViewWidget.prototype = {
		init: function(container, modid){
			var TM = buildTemplate(this, 'widget');
			container.innerHTML = TM.replace('widget');
			
			this.clnCompListWidget = null;
			this.srvCompListWidget = null;
			
			this.viewWidget = null;

			var mod = NS.localizeManager.modules.get(modid);

			this.setModule(mod);
		},
		destroy: function(){
			if (!L.isNull(this.clnCompListWidget)){
				this.clnCompListWidget.destroy();
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
			
			gel('mname').innerHTML = mod.id;
			
			var __self = this;
			mod.reloadLanguageData(function(){
				__self._onLoadModuleData();
				hide('loading'); show('wcont');
			});
		},
		_onLoadModuleData: function(){
			var mod = this.module;
			var TM = this._TM, gel = function(n){ return TM.getEl('widget.'+n);};
			
			if (!L.isNull(this.clnCompListWidget)){
				this.clnCompListWidget.selectChangedEvent.unsubscribe(this.onJSComponentSelectChanged);
				this.clnCompListWidget.destroy();
			}

			this.clnCompListWidget = new NS.JSComponentListWidget(gel('jscplist'), mod);
			this.clnCompListWidget.selectChangedEvent.subscribe(this.onJSComponentSelectChanged, this, true);

			if (!L.isNull(this.srvCompListWidget)){
				this.srvCompListWidget.selectChangedEvent.unsubscribe(this.onSrvComponentSelectChanged);
				this.srvCompListWidget.destroy();
			}

			this.srvCompListWidget = new NS.SrvComponentListWidget(gel('srvcplist'), mod);
			this.srvCompListWidget.selectChangedEvent.subscribe(this.onSrvComponentSelectChanged, this, true);
		},
		onSrvComponentSelectChanged: function(evt, prm){
			if (L.isNull(this.viewWidget)){
				this.viewWidget = new NS.ComponentViewWidget(this._TM.getEl('widget.jscpview'));
			}
			this.viewWidget.setComponent(prm[0]);
		},
		onJSComponentSelectChanged: function(evt, prm){
			if (L.isNull(this.viewWidget)){
				this.viewWidget = new NS.ComponentViewWidget(this._TM.getEl('widget.jscpview'));
			}
			this.viewWidget.setComponent(prm[0]);
		}
	};
	NS.ModuleViewWidget = ModuleViewWidget;

};