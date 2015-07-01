<?php
/**
 * @package Abricos
 * @subpackage I18n
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

require_once 'dbquery.php';

class I18nModuleManager extends Ab_ModuleManager {

    /**
     * @var I18nModule
     */
    public $module = null;

    /**
     * @var I18nModuleManager
     */
    public static $instance = null;

    public function __construct(I18nModule $module){
        parent::__construct($module);

        I18nModuleManager::$instance = $this;
    }

    public function IsAdminRole(){
        return $this->IsRoleEnable(I18nAction::ADMIN);
    }

    public function IsWriteRole(){
        if ($this->IsAdminRole()){
            return true;
        }
        return $this->IsRoleEnable(I18nAction::WRITE);
    }

    public function IsViewRole(){
        if ($this->IsWriteRole()){
            return true;
        }
        return $this->IsRoleEnable(I18nAction::VIEW);
    }

    private $_core = null;

    /**
     * @return I18nCore
     */
    public function GetCore(){
        if (empty($this->_core)){
            require_once 'classes/core.php';
            $this->_core = new I18nCore($this);
        }
        return $this->_core;
    }

    public function AJAX($d){
        $ret = $this->GetCore()->AJAX($d);

        if (empty($ret)){
            $ret = new stdClass();
            $ret->err = 500;
        }

        return $ret;
    }

    public function Bos_MenuData(){
        if (!$this->IsAdminRole()){
            return null;
        }
        $i18n = $this->module->GetI18n();
        return array(
            array(
                "name" => "i18n",
                "title" => $i18n['bosmenu']['title'],
                "icon" => "/modules/i18n/img/logo-48x48.png",
                "url" => "i18n/wspace/ws",
                "parent" => "controlPanel"
            )
        );
    }


}

?>