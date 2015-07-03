<?php

require_once 'structure.php';

class I18nCore {

    /**
     * @var I18nModuleManager
     */
    public $manager;

    /**
     * @var Ab_Database
     */
    public $db;

    public function __construct(I18nModuleManager $manager){
        $this->manager = $manager;
        $this->db = $manager->db;
    }

    public function AJAX($d){
        switch ($d->do){
            case "fullData":
                return $this->FullDataToAJAX();

            case "project":
                return $this->ProjectToAJAX();

            case "template":
                return $this->TemplateToAJAX($d->module, $d->type, $d->name);

            case "configData":
                return $this->ConfigToAJAX();
            case "configSave":
                return $this->ConfigSageToAJAX($d->configData);
        }
        return null;
    }

    public function FullDataToAJAX(){
        $ret = $this->ConfigToAJAX();
        $ret->fullData = 'ok';

        $tRet = $this->ProjectToAJAX();
        if (isset($tRet->project)){
            $ret->project = $tRet->project;
        }

        return $ret;
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                        Project                      */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * */

    public function ProjectToAJAX(){
        $ret = new stdClass();
        $ret->err = 0;

        $project = $this->Project();
        $ret->project = $project->ToAJAX();

        return $ret;
    }

    public function Project(){
        if (!$this->manager->IsAdminRole()){
            return 403;
        }
        $config = $this->Config();
        $project = new I18nProject($config->projectPath);
        return $project;
    }


    /* * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                        Config                       */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * */

    public function ConfigToAJAX(){
        $ret = new stdClass();
        $ret->err = 0;

        $config = $this->Config();
        $ret->configData = $config->ToAJAX();

        return $ret;
    }

    /**
     * @return null|I18nConfig
     */
    public function Config(){
        if (!$this->manager->IsAdminRole()){
            return 403;
        }

        $config = new I18nConfig();
        return $config;
    }

    public function ConfigSageToAJAX($d){
        $res = $this->ConfigSave($d);

        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        return $this->ConfigToAJAX();
    }

    public function ConfigSave($d){
        if (!$this->manager->IsAdminRole()){
            return 403;
        }
        $d = array_to_object($d);
        $phs = I18nModule::$instance->GetPhrases();
        if (isset($d->projectPath)){
            $phs->Set('projectPath', $d->projectPath);
        }
        Abricos::$phrases->Save();
        return true;
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                       Template                      */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * */

    public function TemplateToAJAX($module, $type, $name){
        $ret = new stdClass();
        $ret->err = 0;

        $template = $this->Template($module, $type, $name);
        $ret->template = $template->ToAJAX();

        return $ret;
    }

    /**
     * @param $module
     * @param $type
     * @param $name
     * @return I18nServerTemplate|int|null
     */
    public function Template($module, $type, $name){
        if (!$this->manager->IsAdminRole()){
            return 403;
        }

        $project = $this->Project();
        $prjModule = $project->moduleList->Get($module);
        if (empty($prjModule)){
            return 404;
        }

        $prjItem = null;
        switch ($type){
            case 'contents':
                $prjItem = $prjModule->contentList->Get($name);
                break;
            case 'bricks':
                $prjItem = $prjModule->brickList->Get($name);
                break;
            case 'jss':
                $prjItem = $prjModule->jsList->Get($name);
                break;
        }

        if (empty($prjItem)){
            return 404;
        }

        $template = null;
        switch ($type){
            case 'contents':
            case 'bricks':
                $template = new I18nServerTemplate($prjModule, $prjItem);
                break;
            case 'jss':
                break;
        }

        return $template;
    }


    /* * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                     Old Functions                   */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * */

    public function BoardData(){
        if (!$this->manager->IsViewRole()){
            return null;
        }
        $ret = new stdClass();

        $text = file_get_contents(CWD."/modules/i18n/langs.txt");
        $ret->langs = $text;
        $ret->srv = $this->BrickList();

        return $ret;
    }

    public function ModuleLanguage($module, $component = ''){
        if (!$this->manager->IsAdminRole()){
            return null;
        }

        $ret = new stdClass();
        $ret->srv = $this->ModuleSrvLanguage($module);
        $ret->js = $this->ModuleJSLanguage($module, $component);

        return $ret;
    }

    public function ModuleSrvLanguage($module){
        if (!$this->manager->IsAdminRole()){
            return null;
        }

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
        if (!$this->manager->IsAdminRole()){
            return null;
        }

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
            $cname = substr($fname, 0, strlen($fname) - 3);

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
Brick.mod.i18n.tempData = {};
Brick.mod.i18n.tempData['".$module."'] = lngData;

Brick.mod.i18n.tempDataVs = {};
Brick.mod.i18n.tempDataVs['".$module."'] = lngVs;
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
            for ($i = 0; $i < count($ph->chs); $i++){
                $s = $this->JSLanguagePhraseToText($ph->chs[$i], $lvl + 1);
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
            for ($i = 0; $i < count($phrase->chs); $i++){
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

        return $len > 0;
    }

    public function JSComponentLanguagesSave($module, $component, $languages){
        foreach ($languages as $lang => $phrases){
            $isok = $this->JSComponentLanguageSave($module, $component, $lang, $phrases);
            if (!$isok){
                return false;
            }
        }
        return true;
    }

    private function JSBuildTemplateFileName($module, $component){
        $module = str_replace("..", "", $module);
        $component = str_replace("..", "", $component);
        return CWD."/modules/".$module."/js/".$component.".htm";
    }

    public function JSComponentTemplate($module, $component){
        if (!$this->manager->IsAdminRole()){
            return null;
        }

        $file = $this->JSBuildTemplateFileName($module, $component);

        if (!file_exists($file)){
            return "";
        }

        return @file_get_contents($file);
    }

    public function JSComponentSave($module, $component, $type, $template, $languages){
        if (!$this->manager->IsAdminRole()){
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

        return $len > 0;
    }

    private function SrvBuildTemplateFileName($module, $component, $type){
        $module = str_replace("..", "", $module);
        $component = str_replace("..", "", $component);
        $type = str_replace("..", "", $type);
        return CWD."/modules/".$module."/".$type."/".$component.".html";
    }


    public function SrvComponentTemplate($module, $component, $type){
        if (!$this->manager->IsAdminRole()){
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
            for ($i = 0; $i < count($ph->chs); $i++){
                $s = $this->SrvLanguagePhraseToText($ph->chs[$i], $lvl + 1);
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
            for ($i = 0; $i < count($phrase->chs); $i++){
                $s = $this->SrvLanguagePhraseToText($phrase->chs[$i], 1);
                array_push($arr, $s);
            }
            $text .= implode(",\n", $arr);
        }

        $text .= ");\n";
        $text .= "?>";

        $module = str_replace("..", "", $module);
        $lngid = str_replace("..", "", $lngid);


        $dir = CWD."/modules/".$module."/language";
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

        return $len > 0;
    }

    public function SrvComponentLanguagesSave($module, $component, $languages){
        foreach ($languages as $lang => $phrases){
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

        return $len > 0;
    }

    public function SrvComponentSave($module, $component, $type, $template, $languages){
        if (!$this->manager->IsAdminRole()){
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