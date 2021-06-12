var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
const fs = require('fs')

let slugify = require('slugify')

var response = require('../helper/response');
var connection = require('../helper/connection');
var auth = require('../helper/auth');

var storage = multer.diskStorage({
    destination: path.join(__dirname + './../public/upload/organisasiGambar'),
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage });

router.get('/', async function (req, res, next) {

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_organisasi', function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });


    connection.query('SELECT * FROM tb_organisasi', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

router.get('/:id', function (req, res, next) {

    var org_slug = req.params.id;

    connection.query('SELECT * FROM tb_organisasi WHERE org_slug = ?', [org_slug],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', 1, rows[0], res);
            }
        });
});

router.post('/', auth, upload.single('org_foto'), async function (req, res, next) {

    let org_nama = req.body.org_nama;
    let org_slug = slugify(org_nama.toLowerCase());
    let org_ket = req.body.org_ket;
    let org_foto = req.file === undefined ? "" : req.file.filename;

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

        connection.query('INSERT INTO tb_organisasi (org_nama, org_slug, org_ket, org_foto) values(?, ?, ?, ?)', [org_nama, org_slug.toLowerCase(), org_ket, org_foto], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Menambahkan Data!", 1, 'success', res);
            }
        })

    }

});

router.put('/', auth, upload.single('org_foto'), async function (req, res, next) {

    let org_id = req.body.org_id;
    let org_nama = req.body.org_nama;
    let org_slug = slugify(org_nama.toLowerCase());
    let org_ket = req.body.org_ket;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(org_id) AS cnt, org_foto, org_id FROM tb_organisasi WHERE org_slug = ?', [org_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    let org_foto = req.file === undefined ? check.org_foto : req.file.filename;

    if (check.cnt > 0 && check.org_id != org_id) {
        response.error(false, "Nama Organisasi Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('UPDATE tb_organisasi SET org_nama=?, org_slug=?, org_ket=?, org_foto=? WHERE org_id=?', [org_nama, org_slug, org_ket, org_foto, org_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Di Edit!", 1, 'success', res)
            }
        })
    }
});

router.delete('/:id', auth, async function (req, res) {
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
                    response.ok(true, "Berhasil Menghapus Data!!", 1, 'success', res)
                }
            })
        }
    });
});

module.exports = router;