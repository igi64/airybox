CREATE VIEW vw_folder AS
SELECT  fldl.folder_id AS `id`,
				fldl.user_id AS `user_id`,
        fldl.parent_id AS `parent_id`,
		fldl.name AS `name`,
		NULL AS `content`,
		0 AS `size`,
		fld.mtime AS `mtime`,
		'directory' AS `mime`,
		fldl.read AS `read`,
		fldl.write AS `write`,
		fld.locked AS `locked`,
		fld.hidden AS `hidden`,
		0 AS `width`,
		0 AS `height`
FROM tb_folder_link fldl 
		LEFT JOIN tb_user AS usr ON usr.id=fldl.user_id
		LEFT JOIN tb_folder AS fld ON fld.id=fldl.folder_id;
