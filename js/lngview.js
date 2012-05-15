/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['lnglist.js', 'lib.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var CE = YAHOO.util.CustomEvent;
	var buildTemplate = this.buildTemplate;
	
	var JSLanguageViewWidget = function(container, comp){
		this.init(container, comp);
	};
	JSLanguageViewWidget.prototype = {
		init: function(container, comp){
			var TM = buildTemplate(this, 'widget,row');
			container.innerHTML = TM.replace('widget');
			
			this.phraseRemoveEvent = new CE('phraseRemoveEvent');
			this.phraseUpdateEvent = new CE('phraseUpdateEvent');
			
			var __self = this;
			this.lngSelWidget = new NS.LanguageSelectWidget(TM.getEl('widget.lngsel'), function(lngid){
				__self.render();
			});
			// this.lngSelWidget.setValue('en');
			
			this.lngSelBaseWidget = new NS.LanguageSelectWidget(TM.getEl('widget.lngselbase'), function(lngid){
				__self.render();
			});
			
			this.setComponent(comp);
			
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		destroy: function(){ },
		onClick: function(el){
			var tp = this._TId['row'],
				prefix = el.id.replace(/([0-9]+$)/, ''),
				numid = el.id.replace(prefix, "");
			
			if (numid == 0){
				return false;
			}
			
			switch(prefix){
			
			case tp['bsyncadd']+'-': 
				this.syncAddByKey(numid);
				return true;
			case tp['bsyncdel']+'-': 
				this.syncDelByKey(numid);
				return true;
			
			case tp['brem']+'-': case tp['bremc']+'-':
				this.removeByKey(numid);
				return true;
			case tp['bedit']+'-': case tp['beditc']+'-':
				this.editByKey(numid);
				return true;
			case tp['badd']+'-': case tp['baddc']+'-':
				this.createByKey(numid);
				return true;
			}
		
			return false;
		},
		onPhraseUpdate: function(ph){
			this.phraseUpdateEvent.fire(ph);
			this.render();
		},
		onPhraseRemove: function(ph){
			this.phraseRemoveEvent.fire(ph);
			this.render();
		},
		editByKey: function(key){
			var __self = this, 
				ph = this._edPhList[key]['ph'];
			new PhraseEditorPanel(ph, function(){
				__self.onPhraseUpdate(ph);
			});
		},
		createByKey: function(key){
			var __self = this, 
				pph = this._edPhList[key]['ph'];
			var ph = new NS.Phrase();
			
			new PhraseEditorPanel(ph, function(){
				pph.addChild(ph);
				__self.onPhraseUpdate(ph);
			}, true);
		},
		removeByKey: function(key){
			var __self = this, ph = this._edPhList[key]['ph'];
			new PhraseRemovePanel(this.component, ph, function(){
				__self.onPhraseRemove(ph);
			});
		},
		setComponent: function(comp){
			this.component = comp;
			var TM = this._TM, gel = function(n){ return TM.getEl('widget.'+n);};

			if (L.isNull(comp)){
				Dom.setStyle(gel('empty'), 'display', '');
				Dom.setStyle(gel('view'), 'display', 'none');
				Dom.setStyle(gel('loading'), 'display', 'none');
				return;
			}
			
			Dom.setStyle(gel('empty'), 'display', 'none');
			Dom.setStyle(gel('view'), 'display', '');
			Dom.setStyle(gel('loading'), 'display', 'none');
			this.render();
		},
		syncDelByKey: function(key){
			var ph = this._edPhList[key]['ph'];
			ph.remove();
			this.onPhraseRemove(ph);
			this.render();
		},
		syncAddByKey: function(k){
			var edph = this._edPhList[k];
			if (!edph || edph['st'] != 'n'){ return; }
			
			var ph = edph['ph'];
			
			var arr = [];
			while(!L.isNull(ph)){
				if (L.isNull(ph.parent)){
					break;
				}
				arr[arr.length] = ph;
				ph = ph.parent;
			}
			arr.reverse();

			var comp =  this.component,
				phSrc = comp.getPhrases(this.lngSelWidget.getValue()),
				mnm = comp.module.name;
			
			for (var i=0;i<arr.length;i++){
				var ph = arr[i], tId = ph.getTemplateId(mnm), phf = null;
				phSrc.foreach(function(ch){
					if (ch.getTemplateId(mnm) == tId){
						phf = ch;
						return true;
					}
				});
				if (L.isNull(phf)){
					phf = new NS.Phrase(ph.id, L.isNull(ph.childs) ? ph.title : {});
					phf.status = 'n';
					phSrc.addChild(phf);
				}
				phSrc = phf;
			}
			
			this.onPhraseUpdate(edph['ph']);
			this.render();
		},
		renderRows: function(chs1, chs2){
			chs1 = L.isNull(chs1) ? [] : chs1;
			chs2 = L.isNull(chs2) ? [] : chs2;
			
			var TM = this._TM, lst = "", mnm = this.component.module.name;
			var edPhList = this._edPhList;
			
			
			// новые
			for (var i=0;i<chs2.length;i++){
				var ph = chs2[i],
					tId = ph.getTemplateId(mnm),
					find = false;

				for (var ii=0;ii<chs1.length;ii++){
					if (tId == chs1[ii].getTemplateId(mnm)){
						find = true;
					}
				}
				if (!find){
					var schs = "";
					if (!L.isNull(ph.childs)){
						schs = this.renderRows([], ph.childs);
					}
					var kid = edPhList.length;
					edPhList[kid] = {'st': 'n', 'ph': ph};
					lst += TM.replace('row', {
						'cst': 'fcmpstnew',
						'key': kid, 'id': ph.id, 'ph': ph.title, 'ch': schs,
						'edt': schs == "" ? 'edt' : ''
					});
				}
			}			
			
			for (var i=0;i<chs1.length;i++){
				var ph = chs1[i];
				if (ph.status == 'd'){ continue; }
				var k1 = ph.getTemplateId(mnm),
					find = null;
				
				for (var ii=0;ii<chs2.length;ii++){
					if (chs2[ii].getTemplateId(mnm) == k1){
						find = chs2[ii];
					}
				}
				
				var schs = "";
				if (!L.isNull(ph.childs)){
					schs = this.renderRows(ph.childs, find.childs);
				}
				var kid = edPhList.length;
				edPhList[kid] = {
					'st': L.isNull(find) ? 'd' : '', 
					'ph': ph
				};
				lst += TM.replace('row', {
					'cst': L.isNull(find) ? 'fcmpstdel' : '',
					'key': kid, 'id': ph.id, 'ph': ph.title, 'ch': schs,
					'edt': schs == "" ? 'edt' : ''
				});
			}
			
			return lst;
		},
		render: function(){
			this._keys = [null];
			
			var comp = this.component;
			if (L.isNull(comp)){ return; }
			
			var TM = this._TM;

			var ph1 = comp.getPhrases(this.lngSelWidget.getValue()),
				ph2 = comp.getPhrases(this.lngSelBaseWidget.getValue());
			
			this._edPhList = [null];
			
			TM.getEl('widget.table').innerHTML = 
				this.renderRows(ph1.childs, ph2.childs);
		}
	};
	NS.JSLanguageViewWidget = JSLanguageViewWidget;
	
	
	var PhraseEditorPanel = function(ph, callback, isnew){
		this.phrase = ph;
		this.callback = callback;
		this.isnew = isnew;
		PhraseEditorPanel.superclass.constructor.call(this, {});
	};
	YAHOO.extend(PhraseEditorPanel, Brick.widget.Dialog, {
		initTemplate: function(){
			return buildTemplate(this, 'editor').replace('editor', {
				'type': this.phrase.isContainer() ? 'cont' : '',
				'isnew': this.isnew ? 'isnew' : ''
			});
		},
		onLoad: function(){
			var TM = this._TM, gel = function(n){ return  TM.getEl('editor.'+n); };

			var ph = this.phrase;
			gel('name').value = ph.id;
			gel('value').value = ph.title;
			
			if (this.isnew){
				var elSt = gel('seltype');
				E.on(elSt, 'change', function(){
					if (gel('seltype').value == '1'){
						Dom.removeClass(gel('wrp'), 'cont');
					}else{
						Dom.addClass(gel('wrp'), 'cont');
					}
				});
			}
		},
		onClick: function(el){
			var tp = this._TId['editor'];
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			}
			
			return false;
		},
		save: function(){
			var TM = this._TM, 
				gel = function(n){ return  TM.getEl('editor.'+n); };
			
			Dom.setStyle(gel('btns'), 'display', 'none');
			Dom.setStyle(gel('bloading'), 'display', '');
			
			var name = gel('name').value,
				title = gel('value').value;
			
			this.phrase.update(name, title);
			NS.life(this.callback);
			this.close();
		}
	});
	NS.PhraseEditorPanel = PhraseEditorPanel;
	
	
	var PhraseRemovePanel = function(comp, ph, callback){
		this.component = comp;
		this.phrase = ph;
		this.callback = callback;
		PhraseRemovePanel.superclass.constructor.call(this, {});
	};
	YAHOO.extend(PhraseRemovePanel, Brick.widget.Dialog, {
		initTemplate: function(){
			return buildTemplate(this, 'remove').replace('remove', {
				'path': this.phrase.getTemplateId(this.component.module.name)
			});
		},
		onClick: function(el){
			var tp = this._TId['remove'];
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bremove']: this.phraseRemove(); return true;
			}
			
			return false;
		},
		phraseRemove: function(){
			var TM = this._TM, gel = function(n){ return  TM.getEl('remove.'+n); },
				__self = this;
			Dom.setStyle(gel('btns'), 'display', 'none');
			Dom.setStyle(gel('bloading'), 'display', '');
			
			this.phrase.remove();
			NS.life(this.callback);
			
			this.close();
		}
	});
	NS.PhraseRemovePanel = PhraseRemovePanel;
	

};