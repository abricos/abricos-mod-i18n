/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2012 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
        {name: '{C#MODNAME}', files: ['wordeditor.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var CE = YAHOO.util.CustomEvent;
	
	var buildTemplate = this.buildTemplate;

	var escp = function(s){
		s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		s = s.replace(/\t/g, "&nbsp;&nbsp;&nbsp;");
		s = s.replace(/\n/g, "<br />");
		return s;
	};
	
	var JSTemplateViewRowWidget = function(owner, container, ti){
		this.init(owner, container, ti);
	};
	JSTemplateViewRowWidget.prototype = {
		init: function(owner, container, ti){
			this.owner = owner;
			this.titem = ti;
			
			var TM = buildTemplate(this, 'row');
			
			container.innerHTML += TM.replace('row', {
				'tl': ti['n']
			});
		},
		load: function(){
			var __self = this;
			E.on(this._TM.getEl('row.vwtp'), 'change', function(){
				__self.onViewTypeChanged();
			});
			this.render();
			this.setViewType(1);
		},
		destroy: function(){
			var el = this._TM.getEl('row.id');
			el.parentNode.removeChild(el);
		},
		onMouseUp: function(el){
			if (!Dom.hasClass(el, 'tvw')){ return; }
			
			var sText = NS.getSelectionText();
			if (!L.isString(sText) || sText.length == 0){ return; }
			
			this.owner.onSelectText(this, sText);
		},
		onClick: function(el){
			var tp = this._TId['row'];
			switch(el.id){
			case tp['bcreate']: this.createPhraseBySelected(); return true;
			}
			return false;
		},
		onKeyUp: function(el){
			var TM = this._TM,
				elEd = TM.getEl('row.editor');
			
			if (el.id != elEd.id){ return false; }
			
			var text = elEd.value;
			if (text != this._checkText){
				this._checkText = text;
				this.owner.onTemplateTextChanged(this);
				return true;
			}
			return false;
		},
		onViewTypeChanged: function(){
			this.setViewType(this._TM.getEl('row.vwtp').value);
		},
		setViewType: function(vtp){
			vtp = vtp*1;
			
			var TM = this._TM, gel = function(n){ return TM.getEl('row.'+n);};

			gel('vwtp').value = vtp;

			if (vtp == 3){
				var rg = Dom.getRegion(gel('vresult'));
				if (!rg){
					rg = Dom.getRegion(gel('vsource'));
				}
				var width = Math.max(100, rg.width),
					height = Math.max(50, rg.height)+15;
				
				Dom.setStyle(gel('editor'), 'width', width+'px');
				Dom.setStyle(gel('editor'), 'height', height+'px');
			}
			
			var elWrp = gel('wrp'), rc = Dom.removeClass, ac = Dom.addClass;
			rc(elWrp, 'stresult'); rc(elWrp, 'stsource'); rc(elWrp, 'steditor');

			switch(vtp){
			case 1: ac(elWrp, 'stresult'); break;
			case 2: ac(elWrp, 'stsource'); break;
			case 3: ac(elWrp, 'steditor'); break;
			}
			
		},
		render: function(){
			var TM = this._TM, gel = function(n){ return TM.getEl('row.'+n);};
			var ti = this.titem;
			gel('vresult').innerHTML = escp(ti['t']);
			gel('vsource').innerHTML = escp(ti['t']);
			gel('editor').value = ti['t'];
			
			this._checkText = gel('editor').value;
		},
		createPhraseBySelected: function(){
			var sText = NS.getSelectionTextArea(this._TM.getEl('row.editor'));
			this.owner.onSelectTextArea(this, sText);
		},
		replaceSelPhraseInEditor: function(tpPhId){
			var el = this._TM.getEl('row.editor');
			NS.replaceSelectionTextArea(el, tpPhId);
			this.titem['t'] = el.value;
			this.render();
		},
		updateFromEditor: function(){
			var el = this._TM.getEl('row.editor');
			this.titem['t'] = el.value;
		}
	};
	NS.JSTemplateViewRowWidget = JSTemplateViewRowWidget;
	
	
	var JSTemplateViewWidget = function(container, comp){
		this.init(container, comp);
	};
	JSTemplateViewWidget.prototype = {
		init: function(container, comp){
			var TM = buildTemplate(this, 'widget,row');
			container.innerHTML = TM.replace('widget');
			
			this.createPhraseBySelectEvent = new CE('createPhraseBySelectEvent');
			this.templateTextChangeEvent = new CE('templateTextChangeEvent');
			
			this.ws = [];

			var __self = this;
			E.on(container, 'mouseup', function(e){
                var el = E.getTarget(e);
				__self.onMouseUp(el);
			});
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
			});
			
			E.on(container, 'keyup', function(e){
                var el = E.getTarget(e);
				__self.onKeyUp(el);
			});

			this.setComponent(comp);
		},
		destroy: function(){
			this.clearWS();
		},
		clearWS: function(){
			var ws = this.ws;
			for (var i=0;i<ws.length;i++){
				ws[i].destroy();
			}
			this.ws = [];
			this._TM.getEl('widget.source').innerHTML = "";
		},
		setViewType: function(vtp){
			var ws = this.ws;
			for (var i=0;i<ws.length;i++){
				ws[i].setViewType(vtp);
			}
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
			Dom.setStyle(gel('view'), 'display', 'none');
			Dom.setStyle(gel('loading'), 'display', '');
			
			var __self = this;
			comp.loadTemplate(function(t){
				__self.setTemplate(t);
				Dom.setStyle(gel('view'), 'display', '');
				Dom.setStyle(gel('loading'), 'display', 'none');
				__self.setViewType(3);
			});
		},
		setTemplate: function(t){
			this.clearWS();
			var ta = [];

			if (this.component.type != 'js'){
				ta[ta.length] = {'n': '', 't': t};
			}else {
				
				var exp = new RegExp("<!--{([a-zA-Z0-9_\s]+)}-->", "g"),
					arr = t.match(exp);
				
				if (L.isArray(arr)){
					var st = t;
					for (var i=arr.length-1;i>=0;i--){
						
						var tn = arr[i], sa = st.split(tn);
						st = sa[0];
						var t = sa[1].replace(tn, '');
						
						t = t.replace(/\r\n/g, '\n');
						t = t.replace(/\r/g, '\n');
						
						t = t.replace(/^\n*/, '');
						t = t.replace(/\n*$/, '');
						
						ta[ta.length] = {
							'n': tn.replace('<!--{', '').replace('}-->', ''),
							't': t
						};
					}
					ta = ta.reverse();
				}
			}
			
			var ws = this.ws;
			for (var i=0;i<ta.length;i++){
				ws[ws.length] = new JSTemplateViewRowWidget(this,
					this._TM.getEl('widget.source'),
					ta[i]
				);
			};
			
			this.foreach(function(w){
				w.load();
			});
		},
		foreach: function(f){
			var ws = this.ws;
			for (var i=0;i<ws.length;i++){
				if (NS.life(f, ws[i])){ return; }
			}			
		},
		onMouseUp: function(el){
			this.foreach(function(w){
				return w.onMouseUp(el);
			});
		},
		onClick: function(el){
			this.foreach(function(w){
				return w.onClick(el);
			});
			return false;
		},
		onKeyUp: function(el){
			this.foreach(function(w){
				return w.onKeyUp(el);
			});
		},
		onSelectText: function(wrow, sText){ },
		onSelectTextArea: function(wrow, sText){
			var comp = this.component, ti = wrow.titem;
			this.onCreatePhraseBySelect(comp, ti, sText, wrow);
		},
		onCreatePhraseBySelect: function(comp, ti, sText, wrow){
			this.createPhraseBySelectEvent.fire({
				'component': comp,
				'titem': ti,
				'text': sText,
				'wrow': wrow
			});
		},
		onTemplateTextChanged: function(wrow){
			this.templateTextChangeEvent.fire();
		},
		applyChanges: function(){
			// применить изменения сделанные в редакторе
			var tpl = "";
			this.foreach(function(w){
				w.updateFromEditor();
				var ti = w.titem;
				tpl += "<!--{"+ti['n']+"}-->";
				tpl += ti['t'];
				tpl += "\r\n";
			});
			this.component.template = tpl;
		}
	};
	NS.JSTemplateViewWidget = JSTemplateViewWidget;

};