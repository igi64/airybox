CREATE VIEW vw_elfinder_file AS
SELECT  *
FROM vw_elfinder_file_dir
UNION ALL
SELECT  *
FROM vw_elfinder_file_file;
