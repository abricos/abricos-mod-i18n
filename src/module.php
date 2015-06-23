<?php
/**
 * @package Abricos
 * @subpackage I18n
 * @author Alexander Kuzmin <roosit@abricos.org>
 */


/**
 * Модуль I18n
 */
class I18nModule extends Ab_Module {

    /**
     * Конструктор
     */
    public function __construct(){
        $this->version = "0.2.0";
        $this->name = "i18n";
        $this->permission = new I18nPermission($this);
    }

    /**
     * @return I18nManager
     */
    public function GetManager(){
        if (is_null($this->_manager)){
            require_once 'includes/manager.php';
            $this->_manager = new I18nManager($this);
        }
        return $this->_manager;
    }

}

class I18nAction {
    const VIEW = 10;
    const WRITE = 30;
    const ADMIN = 50;
}

class I18nPermission extends Ab_UserPermission {

    public function I18nPermission(I18nModule $module){
        $defRoles = array(
            new Ab_UserRole(I18nAction::VIEW, Ab_UserGroup::ADMIN),
            new Ab_UserRole(I18nAction::WRITE, Ab_UserGroup::ADMIN),
            new Ab_UserRole(I18nAction::ADMIN, Ab_UserGroup::ADMIN)
        );
        parent::__construct($module, $defRoles);
    }

    public function GetRoles(){
        return array(
            I18nAction::VIEW => $this->CheckAction(I18nAction::VIEW),
            I18nAction::WRITE => $this->CheckAction(I18nAction::WRITE),
            I18nAction::ADMIN => $this->CheckAction(I18nAction::ADMIN)
        );
    }
}

// создать экземляр класса модуля и зарегистрировать его в ядре 
Abricos::ModuleRegister(new I18nModule())

?>