<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Localize
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
			case 'language': return $this->ModuleLanguage($d->module);
			case 'srvtemplate': return $this->SrvComponentTemplate($d->module, $d->component, $d->type);
			case 'srvcompsave': return $this->SrvComponentSave($d->module, $d->component, $d->type, $d->template, $d->language);
			case 'srvcompload': return $this->SrvComponentLoad($d->module, $d->component, $d->type);
			
			case 'jstemplate': return $this->JSComponentTemplate($d->module, $d->component);
			case 'jscompsave': return $this->JSComponentSave($d->module, $d->component, $d->type, $d->template, $d->language);
			case 'jscompload': return $this->JSComponentLoad($d->module, $d->component, $d->type);
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
		
		$text = file_get_contents(CWD."/modules/localize/langs.txt");
		$ret->langs = $text;
		$ret->srv = $this->BrickList();
		
		return $ret;
	}
	
	public function BrickList(){
		if (!$this->IsAdminRole()){ return null; }
		

		$ret = array();
		
		Abricos::$instance->modules->RegisterAllModule();
		$mods = CMSRegistry::$instance->modules->GetModules();
		
		foreach ($mods as $modname => $module){
			
			$arr = array();
			
			$files = globa(CWD."/modules/".$modname."/brick/*.html");
			foreach ($files as $file){
					
				$fi = pathinfo($file);
				
				$bk = new stdClass();
				$bk->nm = $fi['filename'];
				$bk->tp = 'b';
				array_push($arr, $bk);
			}
			
			$files = globa(CWD."/modules/".$modname."/content/*.html");
			foreach ($files as $file){
					
				$fi = pathinfo($file);
			
				$bk = new stdClass();
				$bk->nm = $fi['filename'];
				$bk->tp = 'c';
				array_push($arr, $bk);
			}
			
			$ret[$modname] = $arr;
		}
		return $ret;
	}
	
	public function ModuleLanguage($module, $component = ''){
		if (!$this->IsAdminRole()){ return null; }
		
		$ret = new stdClass();
		$ret->srv = $this->ModuleSrvLanguage($module);
		$ret->js = $this->ModuleJSLanguage($module, $component);
		
		return $ret;
	}
	
	public function ModuleSrvLanguage($module){
		if (!$this->IsAdminRole()){ return null; }
		
		$ret = array();
		$lngfiles = globa(CWD."/modules/".$module."/language/??.php");
		foreach ($lngfiles as $lngfile){
			$fi = pathinfo($lngfile);
			
			$lngid = $fi['filename'];
			
			$arr = include($lngfile);
			if (is_array($arr)){
				$ret[$lngid] = $arr;
			}
		}
		return $ret;
	}
	
	public function ModuleJSLanguage($module, $component = ''){
		if (!$this->IsAdminRole()){ return null; }

		$module = str_replace("..", "", $module);
		
		$content = "
var mainBrick = Brick,
	lngData = {},
	lngVs = {},
	crtComponent = '',
	crtLangFile = '';

Brick = {'util': {'Language':{
	'add': function(lng, d, vs){
		lngData[lng] = lngData[lng] || {};
		lngVs[lng] = lngVs[lng] || {};
		
		lngData[lng][crtComponent] = lngData[lng][crtComponent] || {};
		lngVs[lng][crtComponent] = lngVs[lng][crtComponent] || {};
		
		lngData[lng][crtComponent][crtLangFile] = lngData[lng][crtComponent][crtLangFile] || {};
		lngVs[lng][crtComponent][crtLangFile] = lngVs[lng][crtComponent][crtLangFile] || {};
		
		d['mod'] = d['mod'] || {};
		lngData[lng][crtComponent][crtLangFile] = d['mod']['".$module."'] || {};
		lngVs[lng][crtComponent][crtLangFile] = vs || 0;
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

Brick.mod.localize.tempDataVs = {};
Brick.mod.localize.tempDataVs['".$module."'] = lngVs;
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
			$s = addslashes($ph->tl);
			$s = str_replace("\n", "\\n", $s);
			$s = str_replace("\r", "\\r", $s);
			return $t."'".$ph->id."': '".$s."'";
		}
		$text = $t."'".$ph->id."': {\n";
		
		if (count($ph->chs) > 0){
			$arr = array();
			for ($i=0;$i<count($ph->chs);$i++){
				$s = $this->JSLanguagePhraseToText($ph->chs[$i], $lvl+1);
				array_push($arr, $s);
			}
			$text .= implode(",\n", $arr)."\n";
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
		$text = str_replace("\n\n", "\n", $text);
		$text = str_replace("}\n,", "},", $text);
		
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
	
	public function SrvComponentLoad($module, $component, $type){
	
	}
	
	private function JSBuildTemplateFileName($module, $component){
		$module = str_replace("..", "", $module);
		$component = str_replace("..", "", $component);
		return CWD."/modules/".$module."/js/".$component.".htm";
	}
	
	public function JSComponentTemplate($module, $component){
		if (!$this->IsAdminRole()){
			return null;
		}
	
		$file = $this->JSBuildTemplateFileName($module, $component);
	
		if (!file_exists($file)){
			return "";
		}
	
		return @file_get_contents($file);
	}
	
	public function JSComponentSave($module, $component, $type, $template, $languages){
		if (!$this->IsAdminRole()){
			return null;
		}
	
		$ret = new stdClass();
		$lng = new stdClass();
		$tpl = new stdClass();
	
		$lng->error = !$this->JSComponentLanguagesSave($module, $component, $languages);
		if ($lng->error){
			return $ret;
		}
		$lng->text = $this->ModuleJSLanguage($module, $component);
	
		$tpl->error = !$this->JSComponentTemplateSave($module, $component, $template);
		if (!$tpl->error){
			$tpl->text = $this->JSComponentTemplate($module, $component);
		}
	
		$ret->template = $tpl;
		$ret->language = $lng;
		return $ret;
	}
	
	public function JSComponentLoad($module, $component, $type){
		$ret = new stdClass();
	
		$lng = new stdClass();
		$lng->error = false;
		$lng->text = $this->ModuleJSLanguage($module, $component);
	
		$tpl = new stdClass();
		$tpl->error = false;
		$tpl->text = $this->JSComponentTemplate($module, $component);
	
		$ret->template = $tpl;
		$ret->language = $lng;
		return $ret;
	}
	
	private function JSComponentTemplateSave($module, $component, $template){
		$file = $this->JSBuildTemplateFileName($module, $component);
		if (empty($template) && !file_exists($file)){
			return true;
		}
			
		$hdl = @fopen($file, 'wb');
	
		if (empty($hdl)){
			return false;
		}
	
		$len = fwrite($hdl, $template);
		fclose($hdl);
	
		return $len>0;
	}
		
	private function SrvBuildTemplateFileName($module, $component, $type){
		$module = str_replace("..", "", $module);
		$component = str_replace("..", "", $component);
		$type = str_replace("..", "", $type);
		return CWD."/modules/".$module."/".$type."/".$component.".html";
	}
	
	
	public function SrvComponentTemplate($module, $component, $type){
		if (!$this->IsAdminRole()){
			return null;
		}
		$file = $this->SrvBuildTemplateFileName($module, $component, $type);
		
		if (!file_exists($file)){
			return "";
		}
		
		return @file_get_contents($file);
	}
	
	private function SrvLanguagePhraseToText($ph, $lvl){
		$t = str_repeat("\t", $lvl);
		if (!is_array($ph->chs)){
			$s = $ph->tl;
			$s = str_replace('\\', '\\\\', $s);
			$s = str_replace('"', '\"', $s);
			return $t.'"'.$ph->id.'" => "'.$s.'"';
		}
		$text = $t."'".$ph->id."' => array(\n";
	
		if (count($ph->chs) > 0){
			$arr = array();
			for ($i=0;$i<count($ph->chs);$i++){
				$s = $this->SrvLanguagePhraseToText($ph->chs[$i], $lvl+1);
				array_push($arr, $s);
			}
			$text .= implode(",\n", $arr)."\n";
		}
	
		$text .= $t.")\n";
	
		return $text;
	}
	
	public function SrvComponentLanguageSave($module, $component, $lngid, $phrase){
		$text = "<?php\n";
		$text .= "return array(\n";
		
		
		if (is_array($phrase->chs)){
			$arr = array();
			for ($i=0;$i<count($phrase->chs);$i++){
				$s = $this->SrvLanguagePhraseToText($phrase->chs[$i], 1);
				array_push($arr, $s);
			}
			$text .= implode(",\n", $arr);
		}
		
		$text .= ");\n";
		$text .= "?>";
		
		$module = str_replace("..", "", $module);
		$lngid = str_replace("..", "", $lngid);
		
		
		$dir =  CWD."/modules/".$module."/language";
		if (!is_dir($dir)){
			if (!mkdir($dir)){
				return false;
			}
		}
		$file = $dir."/".$lngid.".php";
		
		$hdl = fopen($file, 'wb');
		
		if (empty($hdl)){
			return false;
		}
		$len = fwrite($hdl, $text);
		fclose($hdl);
		
		return $len>0;
	}
	
	public function SrvComponentLanguagesSave($module, $component, $languages){
		foreach($languages as $lang => $phrases){
			$isok = $this->SrvComponentLanguageSave($module, $component, $lang, $phrases);
			if (!$isok){
				return false;
			}
		}
		return true;
	}
	
	public function SrvComponentTemplateSave($module, $component, $type, $template){
		
		$module = str_replace("..", "", $module);
		$component = str_replace("..", "", $component);
		$type = str_replace("..", "", $type);
		
		$file = CWD."/modules/".$module."/".$type."/".$component.".html";
		
		if (empty($template) && !file_exists($file)){
			return true;
		}
			
		$hdl = @fopen($file, 'wb');
		
		if (empty($hdl)){
			return false;
		}
		
		$len = fwrite($hdl, $template);
		fclose($hdl);
		
		return $len>0;
	}
	
	public function SrvComponentSave($module, $component, $type, $template, $languages){
		if (!$this->IsAdminRole()){
			return null;
		}
		
		$ret = new stdClass();
		$lng = new stdClass();
		$tpl = new stdClass();
		
		$lng->error = !$this->SrvComponentLanguagesSave($module, $component, $languages);
		if ($lng->error){
			return $ret;
		}
		$lng->text = $this->ModuleSrvLanguage($module, $component);
		
		$tpl->error = !$this->SrvComponentTemplateSave($module, $component, $type, $template);
		if (!$tpl->error){
			$tpl->text = $this->SrvComponentTemplate($module, $component, $type);
		}
		
		$ret->template = $tpl;
		$ret->language = $lng;
		return $ret;
	}
	

}

?>