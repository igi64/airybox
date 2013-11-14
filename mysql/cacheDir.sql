SELECT  fldl.folder_id AS `id`,
				fldl.user_id AS `user_id`,
        fldl.parent_id AS `parent_id`,
		fldl.name AS `name`,
		0 AS `size`,
		fld.mtime AS `ts`,
		'directory' AS `mime`,
		fldl.read AS `read`,
		fldl.write AS `write`,
		fld.locked AS `locked`,
		fld.hidden AS `hidden`,
		0 AS `width`,
		0 AS `height`,
		IF (fldlch.id, 1, 0) AS dirs 
FROM    tb_folder_link fldl 
		LEFT JOIN tb_folder_link AS fldlch ON fldlch.parent_id=fldl.folder_id
		LEFT JOIN tb_user AS usr ON usr.id=fldl.user_id
		LEFT JOIN tb_folder AS fld ON fld.id=fldl.folder_id
WHERE fldl.parent_id = '1' AND usr.id = 1
GROUP BY fldl.folder_id /*exclude this line in view*/
UNION ALL
SELECT  fll.file_id AS `id`,
				fll.user_id AS `user_id`,
        fll.parent_id AS `parent_id`,
		fll.name AS `name`,
		fl.size AS `size`,
		fl.mtime AS `ts`,
		fl.mime AS `mime`,
		fll.read AS `read`,
		fll.write AS `write`,
		fl.locked AS `locked`,
		fl.hidden AS `hidden`,
		0 AS `width`,
		0 AS `height`,
		0 AS dirs 
FROM    tb_file_link fll 
		LEFT JOIN tb_user AS usr ON usr.id=fll.user_id
		LEFT JOIN tb_file AS fl ON fl.id=fll.file_id
WHERE fll.parent_id = '1' AND usr.id = 1; 