<?php 
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Localize
 * @copyright Copyright (C) 2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */


/**
 * Модуль интернет-приложения Работа Фрилансера
 */
class LocalizeModule extends Ab_Module {
	
	/**
	 * Конструктор
	 */
	public function __construct(){
		$this->version = "0.1";
		$this->name = "localize";
		$this->permission = new LocalizePermission($this);
	}
	
	/**
	 * @return LocalizeManager
	 */
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once 'includes/manager.php';
			$this->_manager = new LocalizeManager($this);
		}
		return $this->_manager;
	}

	public function GetContentName(){
		return '';
	}
	
}

class LocalizeAction {
	const VIEW	= 10;
	const WRITE	= 30;
	const ADMIN	= 50;
}

class LocalizePermission extends Ab_UserPermission {

	public function LocalizePermission(LocalizeModule $module){
		// объявление ролей по умолчанию
		// используется при инсталяции модуля в платформе
		$defRoles = array(
			new Ab_UserRole(LocalizeAction::VIEW, Ab_UserGroup::ADMIN),
			new Ab_UserRole(LocalizeAction::WRITE, Ab_UserGroup::ADMIN),
			new Ab_UserRole(LocalizeAction::ADMIN, Ab_UserGroup::ADMIN)
		);
		parent::__construct($module, $defRoles);
	}

	public function GetRoles(){
		return array(
			LocalizeAction::VIEW => $this->CheckAction(LocalizeAction::VIEW),
			LocalizeAction::WRITE => $this->CheckAction(LocalizeAction::WRITE),
			LocalizeAction::ADMIN => $this->CheckAction(LocalizeAction::ADMIN)
		);
	}
}

// создать экземляр класса модуля и зарегистрировать его в ядре 
Abricos::ModuleRegister(new LocalizeModule())

?>