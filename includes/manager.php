<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Localize
 * @copyright Copyright (C) 2012 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@Abricos.org)
 */

require_once 'dbquery.php';

class LocalizeManager extends Ab_ModuleManager {
	
	/**
	 * @var LocalizeModule
	 */
	public $module = null;
	
	/**
	 * @var LocalizeManager
	 */
	public static $instance = null; 
	
	public function __construct(LocalizeModule $module){
		parent::__construct($module);
		
		LocalizeManager::$instance = $this;
	}
	
	public function IsAdminRole(){
		return $this->IsRoleEnable(LocalizeAction::ADMIN);
	}
	
	public function IsWriteRole(){
		if ($this->IsAdminRole()){ return true; }
		return $this->IsRoleEnable(LocalizeAction::WRITE);
	}
	
	public function IsViewRole(){
		if ($this->IsWriteRole()){ return true; }
		return $this->IsRoleEnable(LocalizeAction::VIEW);
	}
	
	public function AJAX($d){
		switch($d->do){
			case 'init': return $this->BoardData();
			case 'languagejs': return $this->ModuleJSLanguage($d->module);
			case 'templatejs': return $this->JSComponentTemplate($d->module, $d->component);
			case 'jscompsave': return $this->JSComponentSave($d->module, $d->component, $d->template, $d->language);
		}
		return null;
	}
	
	public function ToArray($rows, &$ids1 = "", $fnids1 = 'uid', &$ids2 = "", $fnids2 = '', &$ids3 = "", $fnids3 = ''){
		$ret = array();
		while (($row = $this->db->fetch_array($rows))){
			array_push($ret, $row);
			if (is_array($ids1)){ $ids1[$row[$fnids1]] = $row[$fnids1]; }
			if (is_array($ids2)){ $ids2[$row[$fnids2]] = $row[$fnids2]; }
			if (is_array($ids3)){ $ids3[$row[$fnids3]] = $row[$fnids3]; }
		}
		return $ret;
	}
	
	public function ToArrayId($rows, $field = "id"){
		$ret = array();
		while (($row = $this->db->fetch_array($rows))){
			$ret[$row[$field]] = $row;
		}
		return $ret;
	}
	
	public function BoardData(){
		if (!$this->IsViewRole()){ return null; }
		$ret = new stdClass();
		return $ret;
	}
	
	public function ModuleJSLanguage($module, $component = ''){
		if (!$this->IsAdminRole()){ return null; }

		$module = str_replace("..", "", $module);
		
		$content = "
var mainBrick = Brick,
	lngData = {},
	crtComponent = '',
	crtLangFile = '';

Brick = {'util': {'Language':{
	'add': function(lng, d){
		lngData[lng] = lngData[lng] || {};
		lngData[lng][crtComponent] = lngData[lng][crtComponent] || {};
		lngData[lng][crtComponent][crtLangFile] = lngData[lng][crtComponent][crtLangFile] || {};
		d['mod'] = d['mod'] || {};
		lngData[lng][crtComponent][crtLangFile] = d['mod']['".$module."'] || {};
	}
}}};
";

		$jsdir = CWD."/modules/".$module."/js";
	
		$files = globa($jsdir."/*.js");
		foreach ($files as $file){
			
			$fi = pathinfo($file);
			$fname = $fi['basename'];
			$cname = substr($fname, 0, strlen($fname)-3);
			
			if (!empty($component) && $cname != $component){ 
				continue; 
			}
			
			$lngfiles = globa($jsdir."/langs/".$cname."_??.js");
			foreach ($lngfiles as $lngfile){
				$fi = pathinfo($lngfile);

				$content .= "
crtComponent='".$cname."';
crtLangFile='".$fi['basename']."';
";
				$content .= @file_get_contents($lngfile);
			}
		}
		
		$content .= "
Brick = mainBrick;
Brick.mod.localize.tempData = {};
Brick.mod.localize.tempData['".$module."'] = lngData;
		";
		
		$content = str_replace("{C#MODNAME}", $module, $content);
		
		return $content;
	}
	
	private function BuildJSLanguageDirPath($module){
		$module = str_replace("..", "", $module);
		return CWD."/modules/".$module."/js/langs/";
	}
	
	private function BuildJSLanguageFileName($component, $lngid){
		$component = str_replace("..", "", $component);
		$lngid = str_replace("..", "", $lngid);
		return $component."_".$lngid.".js";
	}
	
	private function JSLanguagePhraseToText($ph, $lvl){
		$t = str_repeat("\t", $lvl);
		if (!is_array($ph->chs)){
			return $t."'".$ph->id."': '".stripcslashes($ph->tl)."'";
		}
		$text = $t."'".$ph->id."': {\n";
		
		$arr = array();
		for ($i=0;$i<count($ph->chs);$i++){
			$s = $this->JSLanguagePhraseToText($ph->chs[$i], $lvl+1);
			array_push($arr, $s);
		}
		$text .= implode(",\n", $arr);
		if (count($arr) == 1){
			$text .= "\n";
		}
		
		$text .= $t."}\n";
		
		return $text;
	}

	public function JSComponentLanguageSave($module, $component, $lngid, $phrase){
		$text = "Brick.util.Language.add('".$lngid."',{'mod': {'{C#MODNAME}':{\n";
		
		if (is_array($phrase->chs)){
			$arr = array();
			for ($i=0;$i<count($phrase->chs);$i++){
				$s = $this->JSLanguagePhraseToText($phrase->chs[$i], 1);
				array_push($arr, $s);
			}
			$text .= implode(",\n", $arr);
		}
		
		$text .= "}}});";
		
		$dir = $this->BuildJSLanguageDirPath($module);
		if (!is_dir($dir)){
			if (!mkdir($dir)){
				return false;
			}
		}
	
		$file = $dir.$this->BuildJSLanguageFileName($component, $lngid);
		
		$hdl = fopen($file, 'wb');
		
		if (empty($hdl)){
			return false;
		}
		
		$len = fwrite($hdl, $text);
		fclose($hdl);
		
		return $len>0;
	}
	
	public function JSComponentLanguagesSave($module, $component, $languages){
		
		foreach($languages as $lang => $phrases){
			$isok = $this->JSComponentLanguageSave($module, $component, $lang, $phrases);
			if (!$isok){
				return false;
			}
		}
		
		return true;
	}
	
	private function BuildTemplateFileName($module, $component){
		$module = str_replace("..", "", $module);
		$component = str_replace("..", "", $component);
		return CWD."/modules/".$module."/js/".$component.".htm";
	}
	
	public function JSComponentTemplate($module, $component){
		if (!$this->IsAdminRole()){
			return null;
		}
	
		$file = $this->BuildTemplateFileName($module, $component);
	
		if (!file_exists($file)){
			return "";
		}
	
		return @file_get_contents($file);
	}
	
	public function JSComponentSave($module, $component, $template, $languages){
		if (!$this->IsAdminRole()){ return null; }
		
		$ret = new stdClass();
		$lng = new stdClass();
		$tpl = new stdClass();
		
		$lng->error = !$this->JSComponentLanguagesSave($module, $component, $languages);
		if ($lng->error){
			return $ret;
		}
		$lng->languages = $this->ModuleJSLanguage($module, $component);
		
		$tpl->error = !$this->JSComponentTemplateSave($module, $component, $template);
		if (!$tpl->error){
			$tpl->text = $this->JSComponentTemplate($module, $component);
		}
		
		$ret->template = $tpl;
		$ret->language = $lng;
		return $ret;
	}
	
	private function JSComponentTemplateSave($module, $component, $template){
		$file = $this->BuildTemplateFileName($module, $component);
		$hdl = @fopen($file, 'wb');
		
		if (empty($hdl)){ return false; }
		
		$len = fwrite($hdl, $template);
		fclose($hdl);
		
		return $len>0;
	}
	
}

?>