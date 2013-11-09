SELECT * FROM vw_cacheDir
WHERE parent_id = 1
ORDER BY id;

SELECT * FROM vw_cacheDir
WHERE parent_id = 7
ORDER BY id;

SELECT * FROM vw_state
WHERE id = 1
ORDER BY id;

SELECT * FROM vw_state
WHERE id = 7
ORDER BY id;

SELECT * FROM vw_state
WHERE id = 1000000007
ORDER BY id;
