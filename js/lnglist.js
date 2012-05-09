/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	var CE = YAHOO.util.CustomEvent;
	
	var buildTemplate = this.buildTemplate;

	var LNG = this.language;
	
	var LanguageSelectWidget = function(container, changeCallback){
		this.init(container, changeCallback);
	};
	LanguageSelectWidget.prototype = {
		init: function(container, changeCallback){

			var TM = buildTemplate(this, 'select,option');
			var lngs = NS.localizeManager.languages;
			var lst = "";

			for (var n in lngs){
				lst += TM.replace('option', {'id': n, 'tl': lngs[n]});
			}
			container.innerHTML = TM.replace('select', {'rows': lst});
			
			var __self = this, el = TM.getEl('select.id');
			E.on(el, 'change', function(){
				NS.life(changeCallback, __self.getValue());
			});
		},
		destroy: function(){},
		getValue: function(){
			return this._TM.getEl('select.id').value;
		},
		setValue: function(value){
			this._TM.getEl('select.id').value = value;
		}
	};
	NS.LanguageSelectWidget = LanguageSelectWidget;
};