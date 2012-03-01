/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['modlist.js', 'modview.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var LNG = Brick.util.Language.geta(['mod', '{C#MODNAME}']);
	
	var buildTemplate = this.buildTemplate;
	
	var ModuleWorkspaceWidget = function(container){
		this.init(container);
	};
	ModuleWorkspaceWidget.prototype = {
		init: function(container){
			
			var TM = buildTemplate(this, 'widget'),
				gel = function(n){return TM.getEl('widget.'+n); };
			container.innerHTML = TM.replace('widget');
			
			this.modulesWidget = new NS.ModuleListWidget(gel('modlist'));
			this.modulesWidget.selectChangedEvent.subscribe(this.onModulesSelectChanged, this, true);
			
			this.moduleViewWidget = null;
			
			var mod = NS.localizeManager.modules.getByIndex(0);
			if (L.isNull(mod)){ return; }
			
			this.modulesWidget.selectModule(mod);
		},
		destroy: function(){
			if(this.modulesWidget){
				this.modulesWidget.selectChangedEvent.unsubscribe(this.onModulesSelectChanged);
				this.modulesWidget.destroy();
			}
			var el = this._TM.getEl('widget.id');
			el.parentNode.removeChild(el);
		},
		onModulesSelectChanged: function(evt, prm){
			this.setModule(prm[0]);
		},
		setModule: function(module){
			var TM = this._TM;
		
			if (L.isNull(module)){
				if (!L.isNull(this.moduleViewWidget)){
					this.moduleViewWidget.destroy();
					this.moduleViewWidget = null;
				}
				
			}else{
				if (L.isNull(this.moduleViewWidget)){
					this.moduleViewWidget = new NS.ModuleViewWidget(TM.getEl('widget.modview'), module);
				}else{
					this.moduleViewWidget.setModule(module);
				}
			}
		}
	};
	NS.ModuleWorkspaceWidget = ModuleWorkspaceWidget;

};