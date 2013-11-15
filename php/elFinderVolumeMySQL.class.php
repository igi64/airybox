<?php

/**
 * Simple elFinder driver for MySQL.
 *
 * @author Dmitry (dio) Levashov
 **/
class elFinderVolumeMySQL extends elFinderVolumeDriver {
	
	/**
	 * Driver id
	 * Must be started from letter and contains [a-z0-9]
	 * Used as part of volume id
	 *
	 * @var string
	 **/
	protected $driverId = 'm';
	
	/**
	 * Database object
	 *
	 * @var mysqli
	 **/
	protected $db = null;
	
	/**
	 * Tables to store files
	 *
	 * @var string
	 **/
	protected $tbf = '';
	
	/**
	 * Directory for tmp files
	 * If not set driver will try to use tmbDir as tmpDir
	 *
	 * @var string
	 **/
	protected $tmpPath = '';
	
	/**
	 * Numbers of sql requests (for debug)
	 *
	 * @var int
	 **/
	protected $sqlCnt = 0;
	
	/**
	 * Last db error message
	 *
	 * @var string
	 **/
	protected $dbError = '';
	
	/**
	 * Constructor
	 * Extend options with required fields
	 *
	 * @return void
	 * @author Dmitry (dio) Levashov
	 **/
	public function __construct() {
		$opts = array(
			'host'          => 'localhost',
			'user'          => '',
			'pass'          => '',
			'db'            => '',
			'port'          => null,
			'socket'        => null,
			'files_table'   => 'elfinder_file',
			'tmbPath'       => '',
			'tmpPath'       => '',
            'user_id'       => ''
		);
		$this->options = array_merge($this->options, $opts);
		$this->options['mimeDetect'] = 'internal';
	}
	
	/*********************************************************************/
	/*                        INIT AND CONFIGURE                         */
	/*********************************************************************/
	
	/**
	 * Prepare driver before mount volume.
	 * Connect to db, check required tables and fetch root path
	 *
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function init() {
		
		if (!($this->options['host'] || $this->options['socket'])
		||  !$this->options['user'] 
		||  !$this->options['pass'] 
		||  !$this->options['db']
		//||  !$this->options['path']
		||  !$this->options['files_table']
        ||  !$this->options['user_id']) {
			return false;
		}

		$this->db = new mysqli($this->options['host'], $this->options['user'], $this->options['pass'], $this->options['db'], $this->options['port'], $this->options['socket']);

        if ($this->db->connect_error || @mysqli_connect_error()) {
			return false;
		}
		
		$this->db->set_charset('utf8');

		if ($res = $this->db->query('SHOW TABLES')) {
			while ($row = $res->fetch_array()) {
				if ($row[0] == $this->options['files_table']) {
					$this->tbf = $this->options['files_table'];
					break;
				}
			}
		}

		if (!$this->tbf) {
			return false;
		}

        $sql = 'SELECT MIN(folder_id) AS folder_id FROM tb_folder_link WHERE user_id="'.$this->options['user_id'].'"';

        if (($res = $this->query($sql)) && $row = $res->fetch_assoc()) {
            $this->options['path'] = (int)$row['folder_id'];
            $this->root = $this->options['path'];
        } else {
            return false;
        }

		$this->updateCache($this->options['path'], $this->_stat($this->options['path']));

		return true;
	}



	/**
	 * Set tmp path
	 *
	 * @return void
	 * @author Dmitry (dio) Levashov
	 **/
	protected function configure() {
		parent::configure();

		if (($tmp = $this->options['tmpPath'])) {
			if (!file_exists($tmp)) {
				if (@mkdir($tmp)) {
					@chmod($tmp, $this->options['tmbPathMode']);
				}
			}
			
			$this->tmpPath = is_dir($tmp) && is_writable($tmp) ? $tmp : false;
		}
		
		if (!$this->tmpPath && $this->tmbPath && $this->tmbPathWritable) {
			$this->tmpPath = $this->tmbPath;
		}

		$this->mimeDetect = 'internal';
	}
	
	/**
	 * Close connection
	 *
	 * @return void
	 * @author Dmitry (dio) Levashov
	 **/
	public function umount() {
		$this->db->close();
	}
	
	/**
	 * Return debug info for client
	 *
	 * @return array
	 * @author Dmitry (dio) Levashov
	 **/
	public function debug() {
		$debug = parent::debug();
		$debug['sqlCount'] = $this->sqlCnt;
		if ($this->dbError) {
			$debug['dbError'] = $this->dbError;
		}
		return $debug;
	}

	/**
	 * Perform sql query and return result.
	 * Increase sqlCnt and save error if occured
	 *
	 * @param  string  $sql  query
	 * @return misc
	 * @author Dmitry (dio) Levashov
	 **/
	protected function query($sql) {
		$this->sqlCnt++;
		$res = $this->db->query($sql);
		if (!$res) {
			$this->dbError = $this->db->error;
		}
		return $res;
	}

	/**
	 * Create empty object with required mimetype
	 *
	 * @param  string  $path  parent dir path
	 * @param  string  $name  object name
	 * @param  string  $mime  mime type
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function make($path, $name, $mime) {
		//$sql = 'INSERT INTO %s (`parent_id`, `name`, `size`, `mtime`, `mime`, `content`, `read`, `write`) VALUES ("%s", "%s", 0, %d, "%s", "", "%d", "%d")';
		//$sql = sprintf($sql, $this->tbf, $path, $this->db->real_escape_string($name), time(), $mime, $this->defaults['read'], $this->defaults['write']);

        // folder share
        if ($mime == 'directory') {
            try {
                $this->db->autocommit(FALSE); // i.e., start transaction

                $sql = 'SELECT COUNT(user_id) FROM tb_folder_link WHERE folder_id="'.$path.'" AND user_id="'.$this->options['user_id'].'"';
                if (!(($res = $this->query($sql)) && $row = $res->fetch_assoc())) {
                    throw new Exception('Insufficient user privileges');
                }

                $sql = 'INSERT INTO %s (`owner_id`, `mtime`) VALUES ("%s", %d)';
                $sql = sprintf($sql, 'tb_folder', $this->options['user_id'], time());
                if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                    throw new Exception($this->db->error);
                }

                $inserted_id = $this->db->insert_id;

                $sql = 'SELECT user_id FROM tb_folder_link WHERE folder_id="'.$path.'"';
                if ($res = $this->query($sql)) {
                    while ($row = $res->fetch_assoc()) {
                        $user_id = $row['user_id'];
                        $sql = 'INSERT INTO %s (`user_id`, `parent_id`, `folder_id`, `name`, `read`, `write`) VALUES ("%s", "%s", "%s", "%s", "%d", "%d")';
                        $sql = sprintf($sql, 'tb_folder_link', $user_id, $path, $inserted_id, $this->db->real_escape_string($name), $this->defaults['read'], $this->defaults['write']);
                        if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                            throw new Exception($this->db->error);
                        }
                    }
                } else {
                    throw new Exception($this->db->error);
                }

                $this->db->commit();
                $this->db->autocommit(TRUE); // i.e., end transaction
                return true;
            }
            catch ( Exception $e ) {
                // before rolling back the transaction, you'd want
                // to make sure that the exception was db-related
                $this->db->rollback();
                $this->db->autocommit(TRUE); // i.e., end transaction
                return false;
            }
        } else {
            try {
                $this->db->autocommit(FALSE); // i.e., start transaction

                $sql = 'SELECT COUNT(user_id) FROM tb_folder_link WHERE folder_id="'.$path.'" AND user_id="'.$this->options['user_id'].'"';
                if (!(($res = $this->query($sql)) && $row = $res->fetch_assoc())) {
                    throw new Exception('Insufficient user privileges');
                }

                $sql = 'INSERT INTO %s (`owner_id`, `content`, `size`, `mtime`, `mime`) VALUES ("%s", "", 0, %d, "%s")';
                $sql = sprintf($sql, 'tb_file', $this->options['user_id'], time(), $mime);
                if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                    throw new Exception($this->db->error);
                }

                $inserted_id = $this->db->insert_id;

                $sql = 'SELECT user_id FROM tb_folder_link WHERE folder_id="'.$path.'"';
                if ($res = $this->query($sql)) {
                    while ($row = $res->fetch_assoc()) {
                        $user_id = $row['user_id'];
                        $sql = 'INSERT INTO %s (`user_id`, `parent_id`, `file_id`, `name`, `read`, `write`) VALUES ("%s", "%s", "%s", "%s", "%d", "%d")';
                        $sql = sprintf($sql, 'tb_file_link', $user_id, $path, $inserted_id, $this->db->real_escape_string($name), $this->defaults['read'], $this->defaults['write']);
                        if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                            throw new Exception($this->db->error);
                        }
                    }
                } else {
                    throw new Exception($this->db->error);
                }

                $this->db->commit();
                $this->db->autocommit(TRUE); // i.e., end transaction
                return true;
            }
            catch ( Exception $e ) {
                // before rolling back the transaction, you'd want
                // to make sure that the exception was db-related
                $this->db->rollback();
                $this->db->autocommit(TRUE); // i.e., end transaction
                return false;
            }
        }
        // echo $sql;
		//return $this->query($sql) && $this->db->affected_rows > 0;
	}

	/**
	 * Search files
	 *
	 * @param  string  $q  search string
	 * @param  array   $mimes
	 * @return array
	 * @author Dmitry (dio) Levashov
	 **/
	public function search($q, $mimes) {
		$result = array();

		$sql = 'SELECT f.id, f.parent_id, f.name, f.size, f.mtime AS ts, f.mime, f.read, f.write, f.locked, f.hidden, f.width, f.height, 0 AS dirs
				FROM %s AS f 
				WHERE f.user_id="'.$this->options['user_id'].'" AND f.name RLIKE "%s"';
		
		$sql = sprintf($sql, $this->tbf, $this->db->real_escape_string($q));
		
		if (($res = $this->query($sql))) {
			while ($row = $res->fetch_assoc()) {
				if ($this->mimeAccepted($row['mime'], $mimes)) {
					$id = $row['id'];
					if ($row['parent_id']) {
						$row['phash'] = $this->encode($row['parent_id']);
					} 

					if ($row['mime'] == 'directory') {
						unset($row['width']);
						unset($row['height']);
					} else {
						unset($row['dirs']);
					}

					unset($row['id']);
					unset($row['parent_id']);



					if (($stat = $this->updateCache($id, $row)) && empty($stat['hidden'])) {
						$result[] = $stat;
					}
				}
			}
		}
		
		return $result;
	}

	/**
	 * Return temporary file path for required file
	 *
	 * @param  string  $path   file path
	 * @return string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function tmpname($path) {
		return $this->tmpPath.DIRECTORY_SEPARATOR.md5($path);
	}

	/**
	 * Resize image
	 *
	 * @param  string   $hash    image file
	 * @param  int      $width   new width
	 * @param  int      $height  new height
	 * @param  bool     $crop    crop image
	 * @return array|false
	 * @author Dmitry (dio) Levashov
	 * @author Alexey Sukhotin
	 **/
	public function resize($hash, $width, $height, $x, $y, $mode = 'resize', $bg = '', $degree = 0) {
		if ($this->commandDisabled('resize')) {
			return $this->setError(elFinder::ERROR_PERM_DENIED);
		}
		
		if (($file = $this->file($hash)) == false) {
			return $this->setError(elFinder::ERROR_FILE_NOT_FOUND);
		}
		
		if (!$file['write'] || !$file['read']) {
			return $this->setError(elFinder::ERROR_PERM_DENIED);
		}
		
		$path = $this->decode($hash);
		
		if (!$this->canResize($path, $file)) {
			return $this->setError(elFinder::ERROR_UNSUPPORT_TYPE);
		}

		$img = $this->tmpname($path);
		
		if (!($fp = @fopen($img, 'w+'))) {
			return false;
		}

		if (($res = $this->query('SELECT content FROM '.$this->tbf.' WHERE id="'.$path.'"'))
		&& ($r = $res->fetch_assoc())) {
			fwrite($fp, $r['content']);
			rewind($fp);
			fclose($fp);
		} else {
			return false;
		}


		switch($mode) {
			
			case 'propresize':
				$result = $this->imgResize($img, $width, $height, true, true);
				break;

			case 'crop':
				$result = $this->imgCrop($img, $width, $height, $x, $y);
				break;

			case 'fitsquare':
				$result = $this->imgSquareFit($img, $width, $height, 'center', 'middle', $bg ? $bg : $this->options['tmbBgColor']);
				break;
			
			default:
				$result = $this->imgResize($img, $width, $height, false, true);
				break;				
    	}
		
		if ($result) {
			
			$sql = sprintf('UPDATE %s SET content=LOAD_FILE("%s"), mtime=UNIX_TIMESTAMP() WHERE id=%d', $this->tbf, $this->loadFilePath($img), $path);
			
			if (!$this->query($sql)) {
				$content = file_get_contents($img);
				$sql = sprintf('UPDATE %s SET content="%s", mtime=UNIX_TIMESTAMP() WHERE id=%d', $this->tbf, $this->db->real_escape_string($content), $path);
				if (!$this->query($sql)) {
					@unlink($img);
					return false;
				}
			}
			@unlink($img);
			$this->rmTmb($file);
			$this->clearcache();
			return $this->stat($path);
		}
		
   		return false;
	}
	

	/*********************************************************************/
	/*                               FS API                              */
	/*********************************************************************/
	
	/**
	 * Cache dir contents
	 *
	 * @param  string  $path  dir path
	 * @return void
	 * @author Dmitry Levashov
	 **/
	protected function cacheDir($path) {
		$this->dirsCache[$path] = array();

		//$sql = 'SELECT f.id, f.parent_id, f.name, f.size, f.mtime AS ts, f.mime, f.read, f.write, f.locked, f.hidden, f.width, f.height, IF(ch.id, 1, 0) AS dirs
		//		FROM '.$this->tbf.' AS f
		//		LEFT JOIN '.$this->tbf.' AS ch ON ch.parent_id=f.id AND ch.mime="directory"
		//		WHERE f.parent_id="'.$path.'"
		//		GROUP BY f.id';

        $sql = 'SELECT f.id, f.parent_id, f.name, f.size, f.ts, f.mime, f.read, f.write, f.locked, f.hidden, f.width, f.height, f.dirs
				FROM vw_cacheDir AS f
				WHERE f.parent_id="'.$path.'" AND f.user_id="'.$this->options['user_id'].'"
				GROUP BY f.id';

        $res = $this->query($sql);
		if ($res) {
			while ($row = $res->fetch_assoc()) {
				// debug($row);
				$id = $row['id'];
				if ($row['parent_id']) {
					$row['phash'] = $this->encode($row['parent_id']);
				} 
				
				if ($row['mime'] == 'directory') {
					unset($row['width']);
					unset($row['height']);
				} else {
					unset($row['dirs']);
				}
				
				unset($row['id']);
				unset($row['parent_id']);
				
				
				
				if (($stat = $this->updateCache($id, $row)) && empty($stat['hidden'])) {
					$this->dirsCache[$path][] = $id;
				}
			}
		}
		
		return $this->dirsCache[$path];
	}

	/**
	 * Return array of parents paths (ids)
	 *
	 * @param  int   $path  file path (id)
	 * @return array
	 * @author Dmitry (dio) Levashov
	 **/
	protected function getParents($path) {
		$parents = array();

		while ($path) {
			if ($file = $this->stat($path)) {
				array_unshift($parents, $path);
				$path = isset($file['phash']) ? $this->decode($file['phash']) : false;
			}
		}
		
		if (count($parents)) {
			array_pop($parents);
		}
		return $parents;
	}

	/**
	 * Return correct file path for LOAD_FILE method
	 *
	 * @param  string $path  file path (id)
	 * @return string
	 * @author Troex Nevelin
	 **/
	protected function loadFilePath($path) {
		$realPath = realpath($path);
		if (DIRECTORY_SEPARATOR == '\\') { // windows
			$realPath = str_replace('\\', '\\\\', $realPath);
		}
		return $this->db->real_escape_string($realPath);
	}

	/**
	 * Recursive files search
	 *
	 * @param  string  $path   dir path
	 * @param  string  $q      search string
	 * @param  array   $mimes
	 * @return array
	 * @author Dmitry (dio) Levashov
	 **/
	protected function doSearch($path, $q, $mimes) {
		return array();
	}


	/*********************** paths/urls *************************/
	
	/**
	 * Return parent directory path
	 *
	 * @param  string  $path  file path
	 * @return string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _dirname($path) {
		return ($stat = $this->stat($path)) ? ($stat['phash'] ? $this->decode($stat['phash']) : $this->root) : false;
	}

	/**
	 * Return file name
	 *
	 * @param  string  $path  file path
	 * @return string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _basename($path) {
		return ($stat = $this->stat($path)) ? $stat['name'] : false;
	}

	/**
	 * Join dir name and file name and return full path
	 *
	 * @param  string  $dir
	 * @param  string  $name
	 * @return string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _joinPath($dir, $name) {
		$sql = 'SELECT id FROM '.$this->tbf.' WHERE parent_id="'.$dir.'" AND user_id="'.$this->options['user_id'].'" AND name="'.$this->db->real_escape_string($name).'"';

		if (($res = $this->query($sql)) && ($r = $res->fetch_assoc())) {
			$this->updateCache($r['id'], $this->_stat($r['id']));
			return $r['id'];
		}
		return -1;
	}
	
	/**
	 * Return normalized path, this works the same as os.path.normpath() in Python
	 *
	 * @param  string  $path  path
	 * @return string
	 * @author Troex Nevelin
	 **/
	protected function _normpath($path) {
		return $path;
	}
	
	/**
	 * Return file path related to root dir
	 *
	 * @param  string  $path  file path
	 * @return string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _relpath($path) {
		return $path;
	}
	
	/**
	 * Convert path related to root dir into real path
	 *
	 * @param  string  $path  file path
	 * @return string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _abspath($path) {
		return $path;
	}
	
	/**
	 * Return fake path started from root dir
	 *
	 * @param  string  $path  file path
	 * @return string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _path($path) {
		if (($file = $this->stat($path)) == false) {
			return '';
		}
		
		$parentsIds = $this->getParents($path);
		$path = '';
		foreach ($parentsIds as $id) {
			$dir = $this->stat($id);
			$path .= $dir['name'].$this->separator;
		}
		return $path.$file['name'];
	}
	
	/**
	 * Return true if $path is children of $parent
	 *
	 * @param  string  $path    path to check
	 * @param  string  $parent  parent path
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _inpath($path, $parent) {
		return $path == $parent
			? true
			: in_array($parent, $this->getParents($path));
	}
	
	/***************** file stat ********************/
	/**
	 * Return stat for given path.
	 * Stat contains following fields:
	 * - (int)    size    file size in b. required
	 * - (int)    ts      file modification time in unix time. required
	 * - (string) mime    mimetype. required for folders, others - optionally
	 * - (bool)   read    read permissions. required
	 * - (bool)   write   write permissions. required
	 * - (bool)   locked  is object locked. optionally
	 * - (bool)   hidden  is object hidden. optionally
	 * - (string) alias   for symlinks - link target path relative to root path. optionally
	 * - (string) target  for symlinks - link target path. optionally
	 *
	 * If file does not exists - returns empty array or false.
	 *
	 * @param  string  $path    file path 
	 * @return array|false
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _stat($path) {
		//$sql = 'SELECT f.id, f.parent_id, f.name, f.size, f.mtime AS ts, f.mime, f.read, f.write, f.locked, f.hidden, f.width, f.height, IF(ch.id, 1, 0) AS dirs
		//		FROM '.$this->tbf.' AS f
		//		LEFT JOIN '.$this->tbf.' AS p ON p.id=f.parent_id
		//		LEFT JOIN '.$this->tbf.' AS ch ON ch.parent_id=f.id AND ch.mime="directory"
		//		WHERE f.id="'.$path.'"
		//		GROUP BY f.id';

        $sql = 'SELECT f.id, f.parent_id, f.name, f.size, f.ts, f.mime, f.read, f.write, f.locked, f.hidden, f.width, f.height, f.dirs
				FROM vw_stat AS f
				WHERE f.id="'.$path.'" AND f.user_id="'.$this->options['user_id'].'"
				GROUP BY f.id';

		$res = $this->query($sql);
		
		if ($res) {
			$stat = $res->fetch_assoc();
			if ($stat['parent_id']) {
				$stat['phash'] = $this->encode($stat['parent_id']);
			} 
			if ($stat['mime'] == 'directory') {
				unset($stat['width']);
				unset($stat['height']);
			} else {
				unset($stat['dirs']);
			}
			unset($stat['id']);
			unset($stat['parent_id']);
			return $stat;
			
		}
		return array();
	}
	
	/**
	 * Return true if path is dir and has at least one childs directory
	 *
	 * @param  string  $path  dir path
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _subdirs($path) {
		return ($stat = $this->stat($path)) && isset($stat['dirs']) ? $stat['dirs'] : false;
	}
	
	/**
	 * Return object width and height
	 * Usualy used for images, but can be realize for video etc...
	 *
	 * @param  string  $path  file path
	 * @param  string  $mime  file mime type
	 * @return string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _dimensions($path, $mime) {
		return ($stat = $this->stat($path)) && isset($stat['width']) && isset($stat['height']) ? $stat['width'].'x'.$stat['height'] : '';
	}
	
	/******************** file/dir content *********************/
		
	/**
	 * Return files list in directory.
	 *
	 * @param  string  $path  dir path
	 * @return array
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _scandir($path) {
		return isset($this->dirsCache[$path])
			? $this->dirsCache[$path]
			: $this->cacheDir($path);
	}
		
	/**
	 * Open file and return file pointer
	 *
	 * @param  string  $path  file path
	 * @param  string  $mode  open file mode (ignored in this driver)
	 * @return resource|false
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _fopen($path, $mode='rb') {
		$fp = $this->tmbPath
			? @fopen($this->tmpname($path), 'w+')
			: @tmpfile();
		
		
		if ($fp) {
            //if (($res = $this->query('SELECT content FROM '.$this->tbf.' WHERE id="'.$path.'"'))
            if (($res = $this->query('SELECT content FROM '.'vw_file'.' WHERE id="'.$path.'" AND user_id="'.$this->options['user_id'].'"'))
			&& ($r = $res->fetch_assoc())) {
				fwrite($fp, $r['content']);
				rewind($fp);
				return $fp;
			} else {
				$this->_fclose($fp, $path);
			}
		}
		
		return false;
	}
	
	/**
	 * Close opened file
	 *
	 * @param  resource  $fp  file pointer
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _fclose($fp, $path='') {
		@fclose($fp);
		if ($path) {
			@unlink($this->tmpname($path));
		}
	}
	
	/********************  file/dir manipulations *************************/
	
	/**
	 * Create dir and return created dir path or false on failed
	 *
	 * @param  string  $path  parent dir path
	 * @param string  $name  new directory name
	 * @return string|bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _mkdir($path, $name) {
		return $this->make($path, $name, 'directory') ? $this->_joinPath($path, $name) : false;
	}
	
	/**
	 * Create file and return it's path or false on failed
	 *
	 * @param  string  $path  parent dir path
	 * @param string  $name  new file name
	 * @return string|bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _mkfile($path, $name) {
		return $this->make($path, $name, 'text/plain') ? $this->_joinPath($path, $name) : false;
	}
	
	/**
	 * Create symlink. FTP driver does not support symlinks.
	 *
	 * @param  string  $target  link target
	 * @param  string  $path    symlink path
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _symlink($target, $path, $name) {
		return false;
	}
	
	/**
	 * Copy file into another file
	 *
	 * @param  string  $source     source file path
	 * @param  string  $targetDir  target directory path
	 * @param  string  $name       new file name
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _copy($source, $targetDir, $name) {
		$this->clearcache();
		$id = $this->_joinPath($targetDir, $name);

		//$sql = $id > 0
		//	? sprintf('REPLACE INTO %s (id, parent_id, name, content, size, mtime, mime, width, height, `read`, `write`, `locked`, `hidden`) (SELECT %d, %d, name, content, size, mtime, mime, width, height, `read`, `write`, `locked`, `hidden` FROM %s WHERE id=%d)', $this->tbf, $id, $this->_dirname($id), $this->tbf, $source)
		//	: sprintf('INSERT INTO %s (parent_id, name, content, size, mtime, mime, width, height, `read`, `write`, `locked`, `hidden`) SELECT %d, "%s", content, size, %d, mime, width, height, `read`, `write`, `locked`, `hidden` FROM %s WHERE id=%d', $this->tbf, $targetDir, $this->db->real_escape_string($name), time(), $this->tbf, $source);

		//return $this->query($sql);

        //$sql = sprintf('INSERT INTO %s (parent_id, name, content, size, mtime, mime, width, height, `read`, `write`, `locked`, `hidden`) SELECT %d, "%s", content, size, %d, mime, width, height, `read`, `write`, `locked`, `hidden` FROM %s WHERE id=%d', $this->tbf, $targetDir, $this->db->real_escape_string($name), time(), $this->tbf, $source);

        // folder share
        try {
            $this->db->autocommit(FALSE); // i.e., start transaction

            $sql = 'SELECT COUNT(user_id) FROM tb_file_link WHERE file_id="'.$source.'" AND user_id="'.$this->options['user_id'].'"';
            if (!(($res = $this->query($sql)) && $row = $res->fetch_assoc())) {
                throw new Exception('Insufficient user privileges');
            }

            $sql = 'SELECT COUNT(user_id) FROM tb_folder_link WHERE folder_id="'.$targetDir.'" AND user_id="'.$this->options['user_id'].'"';
            if (!(($res = $this->query($sql)) && $row = $res->fetch_assoc())) {
                throw new Exception('Insufficient user privileges');
            }

            if ($id > 0) {
                $sql = 'DELETE FROM %s WHERE id=(SELECT file_id FROM %s WHERE file_id =%d AND user_id="'.$this->options['user_id'].'") LIMIT 1';
                $sql = sprintf($sql, 'tb_file', 'tb_file_link', $id);
                if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                    throw new Exception($this->db->error);
                }
            }

            $sql = 'INSERT INTO %s (`owner_id`, `content`, `size`, `mtime`, `mime`, `hidden`) SELECT %d, `content`, `size`, %d, `mime`, `hidden` FROM %s WHERE id=%d AND user_id="'.$this->options['user_id'].'"';
            $sql = sprintf($sql, 'tb_file', $this->options['user_id'], time(), 'vw_file', $source);
            if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                throw new Exception($this->db->error);
            }

            $inserted_id = $this->db->insert_id;

            $sql = 'SELECT user_id FROM tb_folder_link WHERE folder_id="'.$targetDir.'"';
            if ($res = $this->query($sql)) {
                while ($row = $res->fetch_assoc()) {
                    $user_id = $row['user_id'];
                    $sql = 'INSERT INTO %s (`user_id`, `parent_id`, `file_id`, `name`, `read`, `write`) SELECT %d, %d, %d, `name`, `read`, `write` FROM %s WHERE file_id=%d AND user_id="'.$this->options['user_id'].'"';
                    $sql = sprintf($sql, 'tb_file_link', $user_id, $targetDir, $inserted_id, 'tb_file_link', $source);
                    if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                        throw new Exception($this->db->error);
                    }
                }
            } else {
                throw new Exception($this->db->error);
            }

            $this->db->commit();
            $this->db->autocommit(TRUE); // i.e., end transaction

            unset($content);

            return true;
        }
        catch ( Exception $e ) {
            // before rolling back the transaction, you'd want
            // to make sure that the exception was db-related
            $this->db->rollback();
            $this->db->autocommit(TRUE); // i.e., end transaction

            unset($content);

            return false;
        }
	}
	
	/**
	 * Move file into another parent dir.
	 * Return new file path or false.
	 *
	 * @param  string  $source  source file path
	 * @param  string  $target  target dir path
	 * @param  string  $name    file name
	 * @return string|bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _move($source, $targetDir, $name) {
		//$sql = 'UPDATE %s SET parent_id=%d, name="%s" WHERE id=%d LIMIT 1';
		//$sql = sprintf($sql, $this->tbf, $targetDir, $this->db->real_escape_string($name), $source);

        // folder share
        try {
            $this->db->autocommit(FALSE); // i.e., start transaction

            $sql = 'SELECT COUNT(user_id) FROM tb_file_link WHERE file_id="'.$source.'" AND user_id="'.$this->options['user_id'].'"';
            if (!(($res = $this->query($sql)) && $row = $res->fetch_assoc())) {
                throw new Exception('Insufficient user privileges');
            }

            $sql = 'SELECT COUNT(user_id) FROM tb_folder_link WHERE folder_id="'.$targetDir.'" AND user_id="'.$this->options['user_id'].'"';
            if (!(($res = $this->query($sql)) && $row = $res->fetch_assoc())) {
                throw new Exception('Insufficient user privileges');
            }

            if ($source < 1000000001) {
                $sql = 'DELETE FROM %s WHERE folder_id=%d';
                $sql = sprintf($sql, 'tb_folder_link', $source);

                if ($this->query($sql) && $this->db->affected_rows > 0) {
                    $sql = 'SELECT user_id FROM tb_folder_link WHERE folder_id="'.$targetDir.'"';
                    if ($res = $this->query($sql)) {
                        while ($row = $res->fetch_assoc()) {
                            $user_id = $row['user_id'];
                            $sql = 'INSERT INTO %s (`user_id`, `parent_id`, `folder_id`, `name`, `read`, `write`) VALUES ("%s", "%s", "%s", "%s", "%d", "%d")';
                            $sql = sprintf($sql, 'tb_folder_link', $user_id, $targetDir, $source, $this->db->real_escape_string($name), $this->defaults['read'], $this->defaults['write']);
                            if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                                throw new Exception($this->db->error);
                            }
                        }
                    } else {
                        throw new Exception($this->db->error);
                    }
                } else {
                    throw new Exception($this->db->error);
                }

                $sql = 'UPDATE %s SET owner_id=%d WHERE id=%d LIMIT 1';
                $sql = sprintf($sql, 'tb_folder', $this->options['user_id'], $source);

                //if(!($this->query($sql) && $this->db->affected_rows > 0)){ // this->db->affected_rows can return zero (mysqli/client_found_rows problem)
                if(!$this->query($sql)){
                    throw new Exception($this->db->error);
                }

                //$sql = 'UPDATE %s SET parent_id=%d, name="%s" WHERE folder_id=%d AND user_id="'.$this->options['user_id'].'" LIMIT 1';
                //$sql = sprintf($sql, 'tb_folder_link', $targetDir, $this->db->real_escape_string($name), $source);
            } else {
                $sql = 'DELETE FROM %s WHERE file_id=%d';
                $sql = sprintf($sql, 'tb_file_link', $source);

                if ($this->query($sql) && $this->db->affected_rows > 0) {
                    $sql = 'SELECT user_id FROM tb_folder_link WHERE folder_id="'.$targetDir.'"';
                    if ($res = $this->query($sql)) {
                        while ($row = $res->fetch_assoc()) {
                            $user_id = $row['user_id'];
                            $sql = 'INSERT INTO %s (`user_id`, `parent_id`, `file_id`, `name`, `read`, `write`) VALUES ("%s", "%s", "%s", "%s", "%d", "%d")';
                            $sql = sprintf($sql, 'tb_file_link', $user_id, $targetDir, $source, $this->db->real_escape_string($name), $this->defaults['read'], $this->defaults['write']);
                            if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                                throw new Exception($this->db->error);
                            }
                        }
                    } else {
                        throw new Exception($this->db->error);
                    }
                } else {
                    throw new Exception($this->db->error);
                }

                $sql = 'UPDATE %s SET owner_id=%d WHERE id=%d LIMIT 1';
                $sql = sprintf($sql, 'tb_file', $this->options['user_id'], $source);

                //if(!($this->query($sql) && $this->db->affected_rows > 0)){ // this->db->affected_rows can return zero (mysqli/client_found_rows problem)
                if(!$this->query($sql)){
                    throw new Exception($this->db->error);
                }

                //$sql = 'UPDATE %s SET parent_id=%d, name="%s" WHERE file_id=%d AND user_id="'.$this->options['user_id'].'" LIMIT 1';
                //$sql = sprintf($sql, 'tb_file_link', $targetDir, $this->db->real_escape_string($name), $source);
            }

            $this->db->commit();
            $this->db->autocommit(TRUE); // i.e., end transaction

            return true;
        }
        catch ( Exception $e ) {
            // before rolling back the transaction, you'd want
            // to make sure that the exception was db-related
            $this->db->rollback();
            $this->db->autocommit(TRUE); // i.e., end transaction

            unset($content);

            return false;
        }
	}
		
	/**
	 * Remove file
	 *
	 * @param  string  $path  file path
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _unlink($path) {
        //return $this->query(sprintf('DELETE FROM %s WHERE id=%d AND mime!="directory" LIMIT 1', $this->tbf, $path)) && $this->db->affected_rows;

        $sql = 'DELETE FROM %s WHERE id=(SELECT file_id FROM %s WHERE file_id =%d AND user_id="'.$this->options['user_id'].'") LIMIT 1';
        $sql = sprintf($sql, 'tb_file', 'tb_file_link', $path);

        return $this->query($sql);
	}

	/**
	 * Remove dir
	 *
	 * @param  string  $path  dir path
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _rmdir($path) {
        //return $this->query(sprintf('DELETE FROM %s WHERE id=%d AND mime="directory" LIMIT 1', $this->tbf, $path)) && $this->db->affected_rows;

        $sql = 'DELETE FROM %s WHERE id=(SELECT folder_id FROM %s WHERE folder_id =%d AND user_id="'.$this->options['user_id'].'") LIMIT 1';
        $sql = sprintf($sql, 'tb_folder', 'tb_folder_link', $path);

        return $this->query($sql);
	}
	
	/**
	 * undocumented function
	 *
	 * @return void
	 * @author Dmitry Levashov
	 **/
	protected function _setContent($path, $fp) {
		rewind($fp);
		$fstat = fstat($fp);
		$size = $fstat['size'];
		
		
	}
	
	/**
	 * Create new file and write into it from file pointer.
	 * Return new file path or false on error.
	 *
	 * @param  resource  $fp   file pointer
	 * @param  string    $dir  target dir path
	 * @param  string    $name file name
	 * @param  array     $stat file stat (required by some virtual fs)
	 * @return bool|string
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _save($fp, $dir, $name, $stat) {
		$this->clearcache();
		
		$mime = $stat['mime'];
		$w = !empty($stat['width'])  ? $stat['width']  : 0;
		$h = !empty($stat['height']) ? $stat['height'] : 0;
		
		$id = $this->_joinPath($dir, $name);
		rewind($fp);
		$stat = fstat($fp);
		$size = $stat['size'];
		
		/*if (($tmpfile = tempnam($this->tmpPath, $this->id))) {
			if (($trgfp = fopen($tmpfile, 'wb')) == false) {
				unlink($tmpfile);
			} else {
				while (!feof($fp)) {
					fwrite($trgfp, fread($fp, 8192));
				}
				fclose($trgfp);
				
				$sql = $id > 0
					? 'REPLACE INTO %s (id, parent_id, name, content, size, mtime, mime, width, height) VALUES ('.$id.', %d, "%s", LOAD_FILE("%s"), %d, %d, "%s", %d, %d)'
					: 'INSERT INTO %s (parent_id, name, content, size, mtime, mime, width, height) VALUES (%d, "%s", LOAD_FILE("%s"), %d, %d, "%s", %d, %d)';
				$sql = sprintf($sql, $this->tbf, $dir, $this->db->real_escape_string($name), $this->loadFilePath($tmpfile), $size, time(), $mime, $w, $h);

				$res = $this->query($sql);
				unlink($tmpfile);
				
				if ($res) {
					return $id > 0 ? $id : $this->db->insert_id;
				}
			}
		}*/

		
		$content = '';
		rewind($fp);
		while (!feof($fp)) {
			$content .= fread($fp, 8192);
		}
		
		//$sql = $id > 0
		//	? 'REPLACE INTO %s (id, parent_id, name, content, size, mtime, mime, width, height) VALUES ('.$id.', %d, "%s", "%s", %d, %d, "%s", %d, %d)'
		//	: 'INSERT INTO %s (parent_id, name, content, size, mtime, mime, width, height) VALUES (%d, "%s", "%s", %d, %d, "%s", %d, %d)';
		//$sql = sprintf($sql, $this->tbf, $dir, $this->db->real_escape_string($name), $this->db->real_escape_string($content), $size, time(), $mime, $w, $h);

        // folder share
        try {
            $this->db->autocommit(FALSE); // i.e., start transaction

            $sql = 'SELECT COUNT(user_id) FROM tb_folder_link WHERE folder_id="'.$dir.'" AND user_id="'.$this->options['user_id'].'"';
            if (!(($res = $this->query($sql)) && $row = $res->fetch_assoc())) {
                throw new Exception('Insufficient user privileges');
            }

            if ($id > 0) {
                $sql = 'DELETE FROM %s WHERE id=(SELECT file_id FROM %s WHERE file_id =%d AND user_id="'.$this->options['user_id'].'") LIMIT 1';
                $sql = sprintf($sql, 'tb_file', 'tb_file_link', $id);
                if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                    throw new Exception($this->db->error);
                }
            }
            $sql = 'INSERT INTO %s (`owner_id`, `content`, `size`, `mtime`, `mime`) VALUES ("%s", "%s", %d, %d, "%s")';
            $sql = sprintf($sql, 'tb_file', $this->options['user_id'], $this->db->real_escape_string($content), $size, time(), $mime);
            if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                throw new Exception($this->db->error);
            }

            $inserted_file_id = $this->db->insert_id;

            $sql = 'SELECT user_id FROM tb_folder_link WHERE folder_id="'.$dir.'"';
            if ($res = $this->query($sql)) {
                while ($row = $res->fetch_assoc()) {
                    $user_id = $row['user_id'];
                    $sql = 'INSERT INTO %s (`user_id`, `parent_id`, `file_id`, `name`, `read`, `write`) VALUES ("%s", "%s", "%s", "%s", "%d", "%d")';
                    $sql = sprintf($sql, 'tb_file_link', $user_id, $dir, $inserted_file_id, $this->db->real_escape_string($name), $this->defaults['read'], $this->defaults['write']);
                    if (!($this->query($sql) && $this->db->affected_rows > 0)) {
                        throw new Exception($this->db->error);
                    }
                }
            } else {
                throw new Exception($this->db->error);
            }

            $this->db->commit();
            $this->db->autocommit(TRUE); // i.e., end transaction

            unset($content);

            return $id > 0 ? $id : $inserted_file_id;
        }
        catch ( Exception $e ) {
            // before rolling back the transaction, you'd want
            // to make sure that the exception was db-related
            $this->db->rollback();
            $this->db->autocommit(TRUE); // i.e., end transaction

            unset($content);

            return false;
        }

		//unset($content);

		//if ($this->query($sql)) {
		//	return $id > 0 ? $id : $this->db->insert_id;
		//}
		
		//return false;
	}
	
	/**
	 * Get file contents
	 *
	 * @param  string  $path  file path
	 * @return string|false
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _getContents($path) {
        //return ($res = $this->query(sprintf('SELECT content FROM %s WHERE id=%d', $this->tbf, $path))) && ($r = $res->fetch_assoc()) ? $r['content'] : false;
        return ($res = $this->query(sprintf('SELECT content FROM %s WHERE id=%d AND user_id="'.$this->options['user_id'].'"', 'vw_file', $path))) && ($r = $res->fetch_assoc()) ? $r['content'] : false;
    }
	
	/**
	 * Write a string to a file
	 *
	 * @param  string  $path     file path
	 * @param  string  $content  new file content
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _filePutContents($path, $content) {
        //return $this->query(sprintf('UPDATE %s SET content="%s", size=%d, mtime=%d WHERE id=%d LIMIT 1', $this->tbf, $this->db->real_escape_string($content), strlen($content), time(), $path));
        $sql = 'UPDATE %s SET content="%s", size=%d, mtime=%d WHERE id=(SELECT file_id FROM %s WHERE file_id =%d AND user_id="'.$this->options['user_id'].'") LIMIT 1';
        $sql = sprintf($sql, 'tb_file', $this->db->real_escape_string($content), strlen($content), time(), 'tb_file_link', $path);

        return $this->query($sql);

    }

	/**
	 * Detect available archivers
	 *
	 * @return void
	 **/
	protected function _checkArchivers() {
		return;
	}

	/**
	 * Unpack archive
	 *
	 * @param  string  $path  archive path
	 * @param  array   $arc   archiver command and arguments (same as in $this->archivers)
	 * @return void
	 * @author Dmitry (dio) Levashov
	 * @author Alexey Sukhotin
	 **/
	protected function _unpack($path, $arc) {
		return;
	}

	/**
	 * Recursive symlinks search
	 *
	 * @param  string  $path  file/dir path
	 * @return bool
	 * @author Dmitry (dio) Levashov
	 **/
	protected function _findSymlinks($path) {
		return false;
	}

	/**
	 * Extract files from archive
	 *
	 * @param  string  $path  archive path
	 * @param  array   $arc   archiver command and arguments (same as in $this->archivers)
	 * @return true
	 * @author Dmitry (dio) Levashov, 
	 * @author Alexey Sukhotin
	 **/
	protected function _extract($path, $arc) {
		return false;
	}
	
	/**
	 * Create archive and return its path
	 *
	 * @param  string  $dir    target dir
	 * @param  array   $files  files names list
	 * @param  string  $name   archive name
	 * @param  array   $arc    archiver options
	 * @return string|bool
	 * @author Dmitry (dio) Levashov, 
	 * @author Alexey Sukhotin
	 **/
	protected function _archive($dir, $files, $name, $arc) {
		return false;
	}
	
} // END class 
