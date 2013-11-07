DROP TABLE IF EXISTS `tb_user`;
CREATE TABLE `tb_user` (
  `id`        int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email`     varchar(255) NOT NULL,
  `name`      varchar(255) DEFAULT NULL,
  `surname`   varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY         `key_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `tb_user`
(`id`, `email`,                 `name`,      `surname`) VALUES 
('1',  'localhost@localdomain', 'localhost', 'localdomain'); 

DROP TABLE IF EXISTS `tb_folder`;
CREATE TABLE IF NOT EXISTS `tb_folder` (
  `id`        int(10) unsigned NOT NULL auto_increment,
  `owner_id`  int(10) unsigned NOT NULL,
  `mtime`     int(10) unsigned NOT NULL,
  `locked`    enum('1', '0') NOT NULL default '0',
  `hidden`    enum('1', '0') NOT NULL default '0',
  PRIMARY KEY (`id`),
  CONSTRAINT  `fk_folder_user_id` FOREIGN KEY (owner_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`, `locked`, `hidden`) VALUES 
('1',  '1',        '0',     '0',      '0'); 
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`, `locked`, `hidden`) VALUES 
('2',  '1',        '0',     '0',      '0'); 
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`, `locked`, `hidden`) VALUES 
('3',  '1',        '0',     '0',      '0'); 

DROP TABLE IF EXISTS `tb_folder_link`;
CREATE TABLE IF NOT EXISTS `tb_folder_link` (
  `id`        int(10) unsigned NOT NULL auto_increment,
  `user_id`   int(10) unsigned NOT NULL,
  `parent_id` int(10) unsigned NOT NULL,
  `folder_id` int(10) unsigned NOT NULL,
  `name`      varchar(255) NOT NULL,
  `read`      enum('1', '0') NOT NULL default '1',
  `write`     enum('1', '0') NOT NULL default '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY  `uk_user_parent_name` (`user_id`, `parent_id`, `name`),
  CONSTRAINT  `fk_folder_link_user_id` FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
  CONSTRAINT  `fk_folder_link_parent_id` FOREIGN KEY (parent_id) REFERENCES tb_folder(id) ON DELETE CASCADE,
  CONSTRAINT  `fk_folder_link_folder_id` FOREIGN KEY (folder_id) REFERENCES tb_folder(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `tb_folder_link`
(`id`, `folder_id`, `parent_id`, `user_id`, `name`,    `read`, `write`) VALUES 
('1',  '2',         '1',         '1',       'My Disk', '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `folder_id`, `parent_id`, `user_id`, `name`,           `read`, `write`) VALUES 
('2',  '3',         '1',         '1',       'Shared with me', '1',    '1');

DROP TABLE IF EXISTS `tb_file`;
CREATE TABLE IF NOT EXISTS `tb_file` (
  `id`        int(10) unsigned NOT NULL auto_increment,
  `owner_id`  int(10) unsigned NOT NULL,
  `content`   longblob NOT NULL,
  `size`      int(10) unsigned NOT NULL default '0',
  `mtime`     int(10) unsigned NOT NULL,
  `mime`      varchar(255) NOT NULL default 'unknown',
  `locked`    enum('1', '0') NOT NULL default '0',
  `hidden`    enum('1', '0') NOT NULL default '0',
   PRIMARY KEY (`id`),
   CONSTRAINT  `fk_file_user_id` FOREIGN KEY (owner_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `tb_file_link`;
CREATE TABLE `tb_file_link` (
  `id`        int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id`   int(10) unsigned NOT NULL,
  `parent_id` int(10) unsigned NOT NULL,
  `file_id`   int(10) unsigned NOT NULL,
  `name`      varchar(255) NOT NULL,
  `read`      enum('1', '0') NOT NULL default '1',
  `write`     enum('1', '0') NOT NULL default '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY  `uk_user_parent_name` (`user_id`, `parent_id`, `name`),
  CONSTRAINT  `fk_file_link_user_id` FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
  CONSTRAINT  `fk_file_link_parent_id` FOREIGN KEY (parent_id) REFERENCES tb_folder(id) ON DELETE CASCADE,
  CONSTRAINT  `fk_file_link_file_id` FOREIGN KEY (file_id) REFERENCES tb_file(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
