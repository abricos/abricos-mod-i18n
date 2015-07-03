<?php

class I18nList extends AbricosList {
    public function ToAJAX(){
        $ret = parent::ToAJAX();
        return $ret->list;
    }
}

class I18nConfig {

    public $version;
    public $locales = array();

    public $projectPath = '';

    public function __construct(){
        $phs = I18nModule::$instance->GetPhrases();
        $this->projectPath = $phs->Get('projectPath')->value;


        // Load locales info
        $localesJSON = file_get_contents(CWD."/modules/i18n/locales.json");
        $obj = json_decode($localesJSON);
        $this->version = $obj->version;
        foreach ($obj->list as $locale => $title){
            $this->locales[$locale] = $title;
        }
    }

    public function ToAJAX(){
        $ret = new stdClass();
        $ret->projectPath = $this->projectPath;
        $ret->version = $this->version;
        $ret->locales = $this->locales;
        return $ret;
    }
}

class I18nProjectError {
    const NOT_FOUND = 1;
}

class I18nProject {

    public $error = 0;

    public $coreFolder = '';

    public $modulesFolder = '';

    /**
     * @var I18nProjectModuleList
     */
    public $moduleList = null;

    public function __construct($projectPath){
        $projectPath = realpath($projectPath);
        $projectFile = realpath($projectPath."/multik.json");
        if (!file_exists($projectFile)){
            $this->error = I18nProjectError::NOT_FOUND;
            return;
        }
        $jsonContent = file_get_contents($projectFile);
        $data = json_decode($jsonContent);

        $this->coreFolder = realpath($projectPath."/".$data->groups->core->directory);
        $this->modulesFolder = realpath($projectPath."/".$data->groups->module->directory);

        $this->moduleList = new I18nProjectModuleList();

        foreach ($data->dependencies as $name => $info){
            if ($info->group === "module"){
                $modulePath = realpath($this->modulesFolder."/".$name);
                $module = new I18nProjectModule($name, $modulePath);
                $this->moduleList->Add($module);
            }
        }
    }

    public function ToAJAX(){
        $ret = new stdClass();
        if ($this->error > 0){
            $ret->error = $this->error;
            return $ret;
        }

        $ret->coreFolder = $this->coreFolder;
        $ret->modulesFolder = $this->modulesFolder;

        $ret->modules = $this->moduleList->ToAJAX();

        return $ret;
    }
}

class I18nProjectModule extends AbricosItem {

    public $path = '';

    public $brickList = null;
    public $contentList = null;
    public $jsList = null;

    public function __construct($name, $path){
        $path = realpath($path);

        $this->id = $name;
        $this->path = $path;

        $this->brickList = new I18nProjectItemList();
        $this->contentList = new I18nProjectItemList();
        $this->jsList = new I18nProjectItemList();

        $srcFolder = realpath($path."/src");

        $files = globa($srcFolder."/brick/*.html");
        foreach ($files as $file){
            $this->brickList->Add(new I18nProjectBrick($file));
        }

        $files = globa($srcFolder."/content/*.html");
        foreach ($files as $file){
            $this->contentList->Add(new I18nProjectContent($file));
        }

        $files = globa($srcFolder."/js/*.js");
        foreach ($files as $file){
            $this->jsList->Add(new I18nProjectJS($file));
        }

    }

    public function ToAJAX(){
        $ret = parent::ToAJAX();
        $ret->path = $this->path;
        $ret->bricks = $this->brickList->ToAJAX();
        $ret->contents = $this->contentList->ToAJAX();
        $ret->jss = $this->jsList->ToAJAX();

        return $ret;
    }
}

class I18nProjectModuleList extends I18nList {
    /**
     * @param string $moduleName
     * @return I18nProjectModule
     */
    public function Get($moduleName){
        return parent::Get($moduleName);
    }
}

class I18nProjectItemType {
    const BRICK = 'brick';
    const CONTENT = 'content';
    const JS = 'js';
}

class I18nProjectItem extends AbricosItem {
    public $type = '';
    public $file = '';

    public function __construct($file){
        $this->file = $file;

        $fi = pathinfo($file);
        $this->id = $fi['filename'];
    }

    public function ToAJAX(){
        $ret = parent::ToAJAX();
        // $ret->type = $this->type;
        return $ret;
    }

}

class I18nProjectItemList extends I18nList {
    /**
     * @param mixed $name
     * @return I18nProjectItem
     */
    public function Get($name){
        return parent::Get($name);
    }
}

class I18nProjectBrick extends I18nProjectItem {
    public $type = I18nProjectItemType::BRICK;
}

class I18nProjectContent extends I18nProjectItem {
    public $type = I18nProjectItemType::CONTENT;
}

class I18nProjectJS extends I18nProjectItem {
    public $type = I18nProjectItemType::JS;
}

class I18nServerTemplate {

    public $phrases;

    public $content = '';

    /**
     * @param $prjModule I18nProjectModule
     * @param $prjItem I18nProjectItem
     */
    public function __construct($prjModule, $prjItem){
        $phrasesFolder = realpath($prjModule->path."/src/i18n");
        $files = globa($phrasesFolder."/*.php");

        $phrases = array();

        foreach ($files as $file){
            $fi = pathinfo($file);

            $locale = $fi['filename'];

            $arr = include($file);
            if (is_array($arr)){
                $phrases[$locale] = $arr;
            }
        }

        $this->phrases = $phrases;

        $this->content = file_get_contents($prjItem->file);
    }

    public function ToAJAX(){
        $ret = new stdClass();
        $ret->phrases = $this->phrases;
        $ret->content = $this->content;
        return $ret;
    }

}


?>