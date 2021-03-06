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

	var R = NS.roles;
	var buildTemplate = this.buildTemplate;
	
	var GMID = {
		'ModuleListWidget': 'modlist',
		'AboutWidget': 'about'
	};
	GMIDI = {};
	
	var WSPanel = function(pgInfo){
		this.pgInfo = pgInfo || [];
		
		WSPanel.superclass.constructor.call(this, {
			fixedcenter: true, width: '790px', height: '400px'
		});
	};
	YAHOO.extend(WSPanel, Brick.widget.Panel, {
		initTemplate: function(){
			buildTemplate(this, 'panel');
			
			var nav = NS.navigator;
			return this._TM.replace('panel', {
				'urlhome': nav.ws,
				'urlabout': nav.about
			});
		},
		onLoad: function(){
			this.widget = null;
			var __self = this;
			NS.initI18nManager(function(mgr){
				__self.showPage(__self.pgInfo);
			});
		},
		destroy: function(){},
		showPage: function(p){
			p = L.merge({
				'component': 'modlist',
				'wname': 'ModuleListWidget',
				'p1': '', 'p2': '', 'p3': ''
			}, p || {});

			var __self = this, TM = this._TM, gel = function(n){ return TM.getEl('panel.'+n); };
			Dom.setStyle(gel('board'), 'display', 'none');
			Dom.setStyle(gel('loading'), 'display', '');

			Brick.ff('{C#MODNAME}', p['component'], function(){
				__self._showPageMethod(p);
				Dom.setStyle(gel('board'), 'display', '');
				Dom.setStyle(gel('loading'), 'display', 'none');
			});
		},
		_showPageMethod: function(p){
			
			var wName = p['wname'];
			if (!NS[wName]){ return; }
			
			if (!L.isNull(this.widget)){
				this.widget.destroy();
				this.widget = null;
			}
			var TM = this._TM, gel = function(n){ return TM.getEl('panel.'+n); };
			gel('board').innerHTMl = "";
			
			this.widget = new NS[wName](gel('board'), p['p1'], p['p2'], p['p3']);
			
			for (var n in GMID){
				
				var pfx = GMID[n], 
					miEl = gel('m'+pfx),
					mtEl = gel('mt'+pfx);

				if (wName == n){
					Dom.addClass(miEl, 'sel');
					Dom.setStyle(mtEl, 'display', '');
					
					/*
					var mia = GMIDI[pfx];
					if (L.isArray(mia)){
						
						for (var i=0;i<mia.length;i++){
							var mtiEl = gel('i'+pfx+mia[i]);
							if (mia[i] == this.widget.wsMenuItem){
								Dom.addClass(mtiEl, 'current');
							}else{
								Dom.removeClass(mtiEl, 'current');
							}
						}
					}
					/**/
					
				}else{
					Dom.removeClass(miEl, 'sel');
					Dom.setStyle(mtEl, 'display', 'none');
				}
			}
		}
	});
	NS.WSPanel = WSPanel;
	
	var activeWSPanel = null;
	NS.API.ws = function(){
		var args = arguments;
		var pgInfo = {
			'component': args[0] || 'modlist',
			'wname': args[1] || 'ModuleListWidget',
			'p1': args[2], 'p2': args[3], 'p3': args[4]
		};
		if (L.isNull(activeWSPanel) || activeWSPanel.isDestroy()){
			activeWSPanel = new WSPanel(pgInfo);
		}else{
			activeWSPanel.showPage(pgInfo);
		}
		return activeWSPanel;
	};
	
};