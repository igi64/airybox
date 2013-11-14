CREATE VIEW vw_file AS
SELECT  fll.file_id AS `id`,
				fll.user_id AS `user_id`,
        fll.parent_id AS `parent_id`,
		fll.name AS `name`,
		fl.content AS `content`,
		fl.size AS `size`,
		fl.mtime AS `mtime`,
		fl.mime AS `mime`,
		fll.read AS `read`,
		fll.write AS `write`,
		fl.locked AS `locked`,
		fl.hidden AS `hidden`,
		0 AS `width`,
		0 AS `height`
FROM    tb_file_link fll 
		LEFT JOIN tb_user AS usr ON usr.id=fll.user_id
		LEFT JOIN tb_file AS fl ON fl.id=fll.file_id;
