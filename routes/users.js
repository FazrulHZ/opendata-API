var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var bcrypt = require('bcrypt');
const fs = require('fs')

let slugify = require('slugify')

var response = require('../helper/response');
var connection = require('../helper/connection');
var auth = require('../helper/auth');

var storage = multer.diskStorage({
  destination: path.join(__dirname + './../public/upload/userGambar'),
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

var upload = multer({ storage: storage });

router.get('/', auth, async function (req, res, next) {

  const role = req.user;

  const cekAuth = await new Promise(resolve => {
    connection.query('SELECT * FROM tb_user WHERE user_id = ?', [role.id], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  if (cekAuth.user_lvl !== 'superadmin') {
    return response.noAkses(res);
  }

  const count = await new Promise(resolve => {
    connection.query('SELECT COUNT(*) AS cnt FROM tb_user', function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0].cnt);
      }
    });
  });

  connection.query('SELECT * FROM tb_user LEFT JOIN tb_organisasi ON tb_user.org_id = tb_organisasi.org_id ', function (error, rows, field) {
    if (error) {
      console.log(error);
    } else {
      response.ok(true, 'Data Berhasil Diambil', count, rows, res);
    }
  });
});

router.get('/:id', auth, function (req, res, next) {

  var user_id = req.params.id;

  const role = req.user;

  connection.query('SELECT * FROM tb_user LEFT JOIN tb_organisasi ON tb_user.org_id = tb_organisasi.org_id WHERE user_id = ?', [role.id],
    function (error, rows, field) {
      if (error) {
        console.log(error);
      } else {
        response.ok(true, 'Data Berhasil Diambil', 1, rows[0], res);
      }
    });
});

router.post('/', auth, upload.single('user_foto'), async function (req, res, next) {

  let user_nama = req.body.user_nama;
  let user_email = req.body.user_email;
  let user_fullname = req.body.user_fullname;
  let user_password = req.body.user_password;
  let user_lvl = req.body.user_lvl.toLowerCase();
  let user_foto = req.file === undefined ? "" : req.file.filename;
  let org_id = req.body.org_id;

  //Hash Password
  var salt = bcrypt.genSaltSync(10);
  var pass = bcrypt.hashSync('' + user_password + '', salt);

  const role = req.user;

  const cekAuth = await new Promise(resolve => {
    connection.query('SELECT * FROM tb_user WHERE user_id = ?', [role.id], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  if (cekAuth.user_lvl !== 'superadmin') {
    return response.noAkses(res);
  }

  const cek = await new Promise(resolve => {
    connection.query('SELECT COUNT(user_email) AS cntEmail, COUNT(user_nama) AS cntUsernama, user_foto, user_id FROM tb_user WHERE user_email = ? AND user_nama = ?', [user_email, user_nama], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  if (cek.cntEmail > 0 || cek.cntUsernama > 0) {

    response.error(false, "Email Atau Username Telah Terdaftar!", 'empty', res);

  } else {

    connection.query('INSERT INTO tb_user (user_nama, user_email, user_fullname, user_password, user_lvl, user_foto, org_id) values(?, ?, ?, ?, ?, ?, ?)', [user_nama.toLowerCase(), user_email.toLowerCase(), user_fullname, pass, user_lvl, user_foto, org_id], function (error, rows, field) {
      if (error) {
        console.log(error);
      } else {
        response.ok(true, "Berhasil Menambahkan Data!", 1, 'success', res);
      }
    })

  }

});

router.put('/', auth, upload.single('user_foto'), async function (req, res, next) {

  let user_id = req.body.user_id;
  let user_nama = req.body.user_nama.toLowerCase();
  let user_email = req.body.user_email.toLowerCase();
  let user_fullname = req.body.user_fullname;
  let user_password = req.body.user_password;
  let user_lvl = req.body.user_lvl.toLowerCase();
  let org_id = req.body.org_id;

  //Hash Password
  var salt = bcrypt.genSaltSync(10);
  var pass = bcrypt.hashSync('' + user_password + '', salt);

  const role = req.user;

  const cekAuth = await new Promise(resolve => {
    connection.query('SELECT * FROM tb_user WHERE user_id = ?', [role.id], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  if (cekAuth.user_lvl !== 'superadmin') {
    return response.noAkses(res);
  }

  const cekEmail = await new Promise(resolve => {
    connection.query('SELECT COUNT(user_email) AS cnt, user_id FROM tb_user WHERE user_email = ?', [user_email], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  const cekUsernama = await new Promise(resolve => {
    connection.query('SELECT COUNT(user_nama) AS cnt, user_id FROM tb_user WHERE user_nama = ?', [user_nama], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  const cek = await new Promise(resolve => {
    connection.query('SELECT user_foto FROM tb_user WHERE user_id = ?', [user_id], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  let user_foto = req.file === undefined ? cek.user_foto : req.file.filename;

  if (cekEmail.cnt > 0 && cekEmail.user_id != user_id) {

    response.error(false, "Email Telah Terdaftar!", 'empty', res);

  } else {

    if (cekUsernama.cnt > 0 && cekUsernama.user_id != user_id) {

      response.error(false, "Username Telah Terdaftar!", 'empty', res);

    } else {

      if (req.file === undefined) {

        connection.query('UPDATE tb_user SET user_nama=?, user_email=?, user_fullname=?, user_password=?, user_lvl=?, user_foto=?, org_id=? WHERE user_id=?', [user_nama, user_email, user_fullname, pass, user_lvl, user_foto, org_id, user_id], function (error, rows, field) {
          if (error) {
            console.log(error);
          } else {
            response.ok(true, "Berhasil Di Edit!", 1, 'success', res)
          }
        })

      } else {

        fs.unlink("./public/upload/userGambar/" + cek.user_foto, (err) => {
          if (err) {

            console.log("failed to delete local image:" + err);

          } else {

            console.log('successfully deleted local image');
            connection.query('UPDATE tb_user SET user_nama=?, user_email=?, user_fullname=?, user_password=?, user_lvl=?, user_foto=?, org_id=? WHERE user_id=?', [user_nama, user_email, user_fullname, pass, user_lvl, user_foto, org_id, user_id], function (error, rows, field) {
              if (error) {
                console.log(error);
              } else {
                response.ok(true, "Berhasil Di Edit!", 1, 'success', res)
              }
            })

          }
        });

      }
    }
  }
});

router.delete('/:id', auth, async function (req, res) {
  var user_id = req.params.id;

  const role = req.user;

  const cekAuth = await new Promise(resolve => {
    connection.query('SELECT * FROM tb_user WHERE user_id = ?', [role.id], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  if (cekAuth.user_lvl !== 'superadmin') {
    return response.noAkses(res);
  }

  const check = await new Promise(resolve => {
    connection.query('SELECT * FROM tb_user WHERE user_id = ?', [user_id], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        resolve(rows[0]);
      }
    });
  });

  if (check.user_foto == "") {
    connection.query('DELETE FROM tb_user WHERE user_id=?', [user_id], function (error, rows, field) {
      if (error) {
        console.log(error)
      } else {
        response.ok(true, "Berhasil Menghapus Data!", 1, 'success', res)
      }
    })
  } else {
    fs.unlink("./public/upload/userGambar/" + check.user_foto, (err) => {
      if (err) {
        console.log("failed to delete local image:" + err);
      } else {
        console.log('successfully deleted local image');
        connection.query('DELETE FROM tb_user WHERE user_id=?', [user_id], function (error, rows, field) {
          if (error) {
            console.log(error)
          } else {
            response.ok(true, "Berhasil Menghapus Data!", 1, 'success', res)
          }
        })
      }
    });
  }
});

module.exports = router;