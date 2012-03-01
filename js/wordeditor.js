/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2012 Abricos All rights reserved.
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
	
	var buildTemplate = this.buildTemplate;
	
	var WordEditorPanel = function(){
		
		WordEditorPanel.superclass.constructor.call(this, {
			width: '790px', height: '400px'
		});
	};
	YAHOO.extend(WordEditorPanel, Brick.widget.Dialog, {
		initTemplate: function(){
			return buildTemplate(this, 'panel').replace('panel');
		},
		onLoad: function(){
			
		},
		destroy: function(){
			WordEditorPanel.superclass.destroy.call(this);
		}
	});
	NS.WordEditorPanel = WordEditorPanel;
};