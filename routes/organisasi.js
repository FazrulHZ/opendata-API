var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
const fs = require('fs')

let slugify = require('slugify')

var response = require('../helper/response');
var connection = require('../helper/connection');

var storage = multer.diskStorage({
    destination: path.join(__dirname + './../public/upload/organisasiGambar'),
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage });

router.get('/', function (req, res, next) {
    connection.query('SELECT * FROM tb_organisasi', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', rows, res);
        }
    });
});

router.get('/:id', function (req, res, next) {

    var desa_id = req.params.id;

    connection.query('SELECT * FROM tb_organisasi WHERE desa_id == ?', [desa_id],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok('Data Berhasil Diambil', rows, res);
            }
        });
});

router.post('/', upload.single('org_foto'), async function (req, res, next) {

    let org_nama = req.body.org_nama;
    let org_slug = slugify(org_nama.toLowerCase());
    let org_foto = req.file.filename;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_organisasi WHERE org_slug = ?', [org_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    if (check > 0) {
        response.error(false, "Nama Organisasi Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('INSERT INTO tb_organisasi (org_nama, org_slug, org_foto) values(?, ?, ?)', [org_nama, org_slug.toLowerCase(), org_foto], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Menambahkan Data!", 'success', res);
            }
        })
    }

});

router.put('/', upload.single('org_foto'), async function (req, res, next) {

    let org_id = req.body.org_id;
    let org_nama = req.body.org_nama;
    let org_slug = slugify(org_nama.toLowerCase());
    let org_foto = req.file.filename;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(org_id) AS cnt, org_id FROM tb_organisasi WHERE org_slug = ?', [org_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    if (check.cnt > 0 && check.org_id != org_id) {
        response.error(false, "Nama Organisasi Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('UPDATE tb_organisasi SET org_nama=?, org_slug=?, org_foto=? WHERE org_id=?', [org_nama, org_slug, org_foto, org_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Di Edit!", 'success', res)
            }
        })
    }
});

router.delete('/:id', async function (req, res) {
    var org_id = req.params.id;

    const check = await new Promise(resolve => {
        connection.query('SELECT * FROM tb_organisasi WHERE org_id = ?', [org_id], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    fs.unlink("./public/upload/organisasiGambar/" + check.org_foto, (err) => {
        if (err) {
            console.log("failed to delete local image:" + err);
        } else {
            console.log('successfully deleted local image');
            connection.query('DELETE FROM tb_organisasi WHERE org_id=?', [org_id], function (error, rows, field) {
                if (error) {
                    console.log(error)
                } else {
                    response.ok(true, "Berhasil Menghapus Data!!", 'success', res)
                }
            })
        }
    });
});

module.exports = router;