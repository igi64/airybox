DROP TABLE IF EXISTS `tb_user`;
CREATE TABLE `tb_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `surname` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `key_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `tb_user`
(`id`, `email`, `name`, `surname`) VALUES 
('1', 'localhost@localdomain', 'localhost', 'localdomain'); 

DROP TABLE IF EXISTS `tb_file`;
CREATE TABLE IF NOT EXISTS `tb_file` (
  `id`        int(10) unsigned NOT NULL auto_increment,
  `parent_id` int(10) unsigned NOT NULL,
  `user_id`   int(10) unsigned NOT NULL,
  `name`      varchar(255) NOT NULL,
  `content`   longblob NOT NULL,
  `size`      int(10) unsigned NOT NULL default '0',
  `mtime`     int(10) unsigned NOT NULL,
  `mime`      varchar(255) NOT NULL default 'unknown',
  `read`      enum('1', '0') NOT NULL default '1',
  `write`     enum('1', '0') NOT NULL default '1',
  `locked`    enum('1', '0') NOT NULL default '0',
  `hidden`    enum('1', '0') NOT NULL default '0',
  `width`     int(5) NOT NULL,
  `height`    int(5) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY  `uk_parent_name` (`parent_id`, `name`),
  CONSTRAINT  `fk_file_user_id` FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
  KEY         `key_parent_id`   (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `tb_file`
(`id`, `parent_id`, `user_id`, `name`, `content`, `size`, `mtime`, `mime`, `read`, `write`, `locked`, `hidden`, `width`, `height`) VALUES 
('1', '0', '1', 'DATABASE', '', '0', '0', 'directory', '1', '1', '0', '0', '0', '0');

DROP TABLE IF EXISTS `tb_share`;
CREATE TABLE `tb_share` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `file_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT  `fk_share_user_id` FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
  CONSTRAINT  `fk_share_file_id` FOREIGN KEY (file_id) REFERENCES tb_file(id) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_file_id` (`user_id`,`file_id`),
  UNIQUE KEY `uk_parent_file_id` (`parent_id`,`file_id`),
  KEY `key_file_id` (`file_id`),
  KEY `key_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
