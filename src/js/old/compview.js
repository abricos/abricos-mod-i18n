/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2012 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['tplview.js', 'lngview.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var buildTemplate = this.buildTemplate;
	
	var ComponentViewWidget = function(container, comp){
		comp = comp || null;
		this.init(container, comp);
	};
	ComponentViewWidget.prototype = {
		init: function(container, comp){
			this._minHeight = 30;
			
			var TM = buildTemplate(this, 'widget');
			container.innerHTML = TM.replace('widget');
			
			this.tplViewWidget = null;
			this.lngViewWidget = null;
			
			this.setComponent(comp);
			
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		destroy: function(){
			if (!L.isNull(this.tplViewWidget)){
				this.tplViewWidget.createPhraseBySelectEvent.unsubscribe(this.onTemplateCreatePhraseBySelect);
				this.tplViewWidget.templateTextChangeEvent.unsubscribe(this.onTemplateTextChange);
				this.tplViewWidget.destroy();
				
				this.lngViewWidget.phraseRemoveEvent.unsubscribe(this.onPhraseRemove);
				this.lngViewWidget.phraseUpdateEvent.unsubscribe(this.onPhraseUpdate);
				this.lngViewWidget.destroy();
			}
			var el = this._TM.getEl('widget.id');
			el.parentNode.removeChild(el);
		},
		setComponent: function(comp){
			if (this.component == comp){ return; }
			this.component = comp;
			
			var TM = this._TM, gel = function(n){ return TM.getEl('widget.'+n);};

			gel('cmntl').innerHTML = !L.isNull(comp) ? comp.name : "";
	
			if (L.isNull(this.tplViewWidget)){
				this.tplViewWidget = new NS.JSTemplateViewWidget(TM.getEl('widget.jstplview'), comp);
				this.tplViewWidget.createPhraseBySelectEvent.subscribe(this.onTemplateCreatePhraseBySelect, this, true);
				this.tplViewWidget.templateTextChangeEvent.subscribe(this.onTemplateTextChange, this, true);
				
				this.lngViewWidget = new NS.JSLanguageViewWidget(TM.getEl('widget.jslngview'), comp);
				this.lngViewWidget.phraseRemoveEvent.subscribe(this.onPhraseRemove, this, true);
				this.lngViewWidget.phraseUpdateEvent.subscribe(this.onPhraseUpdate, this, true);
			}else{
				this.tplViewWidget.setComponent(comp);
				this.lngViewWidget.setComponent(comp);
			}
			this.updateSaveStatus();
			
			var rg = Dom.getRegion(gel('id')),
				h = Math.max(rg.height, this._minHeight);
			
			Dom.setStyle(gel('id'), 'minHeight', h+'px');
			this._minHeight = h;
		},
		updateSaveStatus: function(){
			var ischange = false;
			if (!L.isNull(this.component)){
				ischange = this.component.isChange();
			}
			
			var elSB = this._TM.getEl('widget.sb');
			
			if (ischange){
				Dom.setStyle(elSB, 'display', '');
			}else{
				Dom.setStyle(elSB, 'display', 'none');
			}
		},
		onTemplateCreatePhraseBySelect: function(evt, prms){
			var di = prms[0],
				comp = di['component'],
				ti = di['titem'];
			
			
			var path = '';
			if (comp.type == 'js'){
				path = comp.name +'.'+ti['n'];
			}else{
				path += (comp.type == 'brick' ? 'brick' : 'content')+'.'+comp.name;
			}
			
			var lng = this.lngViewWidget.lngSelWidget.getValue(),
				ph = comp.findPhrase(lng, path);

			if (L.isNull(ph)){
				path += '.1';
			}else{
				path += '.' + NS.Phrase.generateChildId(ph);
			}
			var phrase = comp.createPhrase(lng, path, di['text']);
			if (L.isNull(phrase)){ return; }
			
			var tpPhId = phrase.getTemplateId(comp);
			di['wrow'].replaceSelPhraseInEditor(tpPhId);
			
			this.tplViewWidget.applyChanges();
			
			this.lngViewWidget.render();
			this.updateSaveStatus();
		},
		onTemplateTextChange: function(){
			this.tplViewWidget.applyChanges();
			this.updateSaveStatus();
		},
		onPhraseRemove: function(){
			this.updateSaveStatus();
		},
		onPhraseUpdate: function(){
			this.updateSaveStatus();
		},
		onClick: function(el){
			var tp = this._TId['widget'];
			switch(el.id){
			case tp['bsave']: this.saveChanged(); return true;
			case tp['bcancel']: this.cancelChanged(); return true;
			}
			return false;
		},
		saveChanged: function(){
			this.tplViewWidget.applyChanges();
			var __self = this;
			this.component.saveChanges(function(){
				__self.updateSaveStatus();
			});
		},
		cancelChanged: function(){
			var __self = this;
			this.component.revertChanges(function(){
				__self.updateSaveStatus();
			});
		}
	};
	
	NS.ComponentViewWidget = ComponentViewWidget;

};