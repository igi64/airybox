CREATE TABLE `tb_user` (
  `id`        int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email`     varchar(255) NOT NULL,
  `name`      varchar(255) DEFAULT NULL,
  `surname`   varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY         `key_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `tb_user`
(`id`, `email`,             `name`, `surname`) VALUES 
('1',  'izboran@gmail.com', 'Igor', 'Zboran'); 

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
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('1',  '1',        '1383910130', '0',      '0'); 
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('2',  '1',        '1383910140', '0',      '0'); 
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('3',  '1',        '1383910150', '0',      '0');
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('4',  '1',        '1383910160', '0',      '0');
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('5',  '1',        '1383910170', '0',      '0');
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('6',  '1',        '1383910180', '0',      '0');
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('7',  '1',        '1383910190', '0',      '0');
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('8',  '1',        '1383910200', '0',      '0');
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('9',  '1',        '1383910210', '0',      '0');
INSERT INTO `tb_folder`
(`id`, `owner_id`, `mtime`,      `locked`, `hidden`) VALUES 
('10',  '1',        '1383910220', '0',      '0');

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

INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('1',  '1',        '1',       '1',    '1383910510', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('2',  '1',        '11',       '2',    '1383910520', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('3',  '1',        '2',       '1',    '1383910530', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('4',  '1',        '4',       '1',    '1383910540', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('5',  '1',        '1',       '1',    '1383910550', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('6',  '1',        '2',       '1',    '1383910560', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('7',  '1',        '1',       '1',    '1383910570', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('8',  '1',        '1',       '1',    '1383910580', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('9',  '1',        '11',       '2',    '1383910590', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('10',  '1',        '2',       '1',   '1383910600', 'text/plain', '0',      '0'); 
INSERT INTO `tb_file`
(`id`, `owner_id`, `content`, `size`, `mtime`,      `mime`,       `locked`, `hidden`) VALUES 
('11',  '1',        '3',       '1',   '1383910610', 'text/plain', '0',      '0'); 

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
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('1',  '1',         '1',         '2',       'My Disk',     '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('2',  '1',         '2',         '3',       'dir1',        '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('3',  '1',         '2',         '4',       'dir11',       '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('4',  '1',         '2',         '5',       'dir2',        '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('5',  '1',         '2',         '6',       'emptydir',    '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('6',  '1',         '2',         '7',       'nonemptydir', '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('7',  '1',         '2',         '8',       'walk',        '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('8',  '1',         '7',         '9',       'dir1',        '1',    '1');
INSERT INTO `tb_folder_link`
(`id`, `user_id`, `parent_id`, `folder_id`, `name`,        `read`, `write`) VALUES 
('9',  '1',         '7',         '10',      'dir2',        '1',    '1');

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

INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('1',  '1',       '3',         '1',       '1.txt',  '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('2',  '1',       '4',         '2',       '11.txt', '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('3',  '1',       '5',         '3',       '2.txt',  '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('4',  '1',       '7',         '4',       '4.txt',  '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('5',  '1',       '9',         '5',       '1.txt',  '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('6',  '1',       '10',         '6',       '2.txt',  '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('7',  '1',       '8',         '7',       '1.txt',  '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('8',  '1',       '2',         '8',       '1.txt',  '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('9',  '1',       '2',         '9',       '11.txt', '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('10',  '1',      '2',         '10',       '2.txt', '1',    '1');
INSERT INTO `tb_file_link`
(`id`, `user_id`, `parent_id`, `file_id`, `name`,   `read`, `write`) VALUES 
('11',  '1',      '2',         '11',       '3.txt', '1',    '1');
