/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2012 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['jstplview.js', 'jslngview.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var buildTemplate = this.buildTemplate;
	
	var JSComponentViewWidget = function(container, comp){
		comp = comp || null;
		this.init(container, comp);
	};
	JSComponentViewWidget.prototype = {
		init: function(container, comp){
			this._minHeight = 30;
			
			var TM = buildTemplate(this, 'widget');
			container.innerHTML = TM.replace('widget');
			
			this.jsTemplateViewWidget = null;
			this.jsLanguageViewWidget = null;
			
			this.setComponent(comp);
			
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		destroy: function(){
			if (!L.isNull(this.jsTemplateViewWidget)){
				this.jsTemplateViewWidget.createPhraseBySelectEvent.unsubscribe(this.onTemplateCreatePhraseBySelect);
				this.jsTemplateViewWidget.templateTextChangeEvent.unsubscribe(this.onTemplateTextChange);
				this.jsTemplateViewWidget.destroy();
				
				this.jsLanguageViewWidget.phraseRemoveEvent.unsubscribe(this.onPhraseRemove);
				this.jsLanguageViewWidget.phraseUpdateEvent.unsubscribe(this.onPhraseUpdate);
				this.jsLanguageViewWidget.destroy();
			}
			var el = this._TM.getEl('widget.id');
			el.parentNode.removeChild(el);
		},
		setComponent: function(comp){
			if (this.component == comp){ return; }
			this.component = comp;
			
			var TM = this._TM, gel = function(n){ return TM.getEl('widget.'+n);};

			gel('cmntl').innerHTML = !L.isNull(comp) ? comp.name : "";
	
			if (L.isNull(this.jsTemplateViewWidget)){
				this.jsTemplateViewWidget = new NS.JSTemplateViewWidget(TM.getEl('widget.jstplview'), comp);
				this.jsTemplateViewWidget.createPhraseBySelectEvent.subscribe(this.onTemplateCreatePhraseBySelect, this, true);
				this.jsTemplateViewWidget.templateTextChangeEvent.subscribe(this.onTemplateTextChange, this, true);
				
				this.jsLanguageViewWidget = new NS.JSLanguageViewWidget(TM.getEl('widget.jslngview'), comp);
				this.jsLanguageViewWidget.phraseRemoveEvent.subscribe(this.onPhraseRemove, this, true);
				this.jsLanguageViewWidget.phraseUpdateEvent.subscribe(this.onPhraseUpdate, this, true);
			}else{
				this.jsTemplateViewWidget.setComponent(comp);
				this.jsLanguageViewWidget.setComponent(comp);
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
				ti = di['titem'],
				path = comp.name+'.'+ti['n'],
				lng = this.jsLanguageViewWidget.languageSelectWidget.getValue(),
				ph = comp.findPhrase(lng, path);

			if (L.isNull(ph)){
				path += '.1';
			}else{
				path += '.' + NS.Phrase.generateChildId(ph);
			}
			var phrase = comp.createPhrase(lng, path, di['text']);
			if (L.isNull(phrase)){ return; }
			
			var tpPhId = phrase.getTemplateId(comp.module.name);
			di['wrow'].replaceSelPhraseInEditor(tpPhId);
			
			this.jsTemplateViewWidget.applyChanges();
			
			this.jsLanguageViewWidget.render();
			this.updateSaveStatus();
		},
		onTemplateTextChange: function(){
			this.jsTemplateViewWidget.applyChanges();
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
			this.jsTemplateViewWidget.applyChanges();
			this.component.saveChanges();
		},
		cancelChanged: function(){
			
		}
	};
	
	NS.JSComponentViewWidget = JSComponentViewWidget;

};