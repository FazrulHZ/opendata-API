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
    destination: path.join(__dirname + './../public/upload/grupGambar'),
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage });

router.get('/', async function (req, res, next) {

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_grup', function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT * FROM tb_grup', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

router.get('/:id', function (req, res, next) {

    var grup_slug = req.params.id;

    connection.query('SELECT * FROM tb_grup WHERE grup_slug = ?', [grup_slug],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', 1, rows[0], res);
            }
        });
});

router.post('/', auth, upload.single('grup_foto'), async function (req, res, next) {

    let grup_nama = req.body.grup_nama;
    let grup_slug = slugify(grup_nama.toLowerCase());
    let grup_foto = req.file === undefined ? "" : req.file.filename;
    let grup_deskripsi = req.body.grup_deskripsi;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_grup WHERE grup_slug = ?', [grup_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    if (check > 0) {
        response.error(false, "Nama Grup Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('INSERT INTO tb_grup (grup_nama, grup_slug, grup_foto, grup_deskripsi) values(?, ?, ?, ?)', [grup_nama, grup_slug.toLowerCase(), grup_foto, grup_deskripsi], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Menambahkan Data!", 1, 'success', res);
            }
        })
    }

});

router.put('/', auth, upload.single('grup_foto'), async function (req, res, next) {

    let grup_id = req.body.grup_id;
    let grup_nama = req.body.grup_nama;
    let grup_slug = slugify(grup_nama.toLowerCase());
    let grup_deskripsi = req.body.grup_deskripsi;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(grup_id) AS cnt, grup_foto, grup_id FROM tb_grup WHERE grup_slug = ?', [grup_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    let grup_foto = req.file === undefined ? check.grup_foto : req.file.filename;

    if (check.cnt > 0 && check.grup_id != grup_id) {
        response.error(false, "Nama Grup Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('UPDATE tb_grup SET grup_nama=?, grup_slug=?, grup_foto=?, grup_deskripsi=? WHERE grup_id=?', [grup_nama, grup_slug, grup_foto, grup_deskripsi, grup_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Di Edit!", 1, 'success', res)
            }
        })
    }
});

router.delete('/:id', auth, async function (req, res) {
    var grup_id = req.params.id;

    const check = await new Promise(resolve => {
        connection.query('SELECT * FROM tb_grup WHERE grup_id = ?', [grup_id], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    fs.unlink("./public/upload/grupGambar/" + check.grup_foto, (err) => {
        if (err) {
            console.log("failed to delete local image:" + err);
        } else {
            console.log('successfully deleted local image');
            connection.query('DELETE FROM tb_grup WHERE grup_id=?', [grup_id], function (error, rows, field) {
                if (error) {
                    console.log(error)
                } else {
                    response.ok(true, "Berhasil Menghapus Data!!", 1, 'success', res)
                }
            })
        }
    });
});

// Get Dataset Berdasarkan Grup

router.get('/dataset/:slug', async function (req, res, next) {

    var grup_slug = req.params.slug;

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(tb_dataset.dataset_id) AS cnt, tb_grup.* FROM tb_grup RIGHT JOIN tb_dataset ON tb_grup.grup_id = tb_dataset.grup_id WHERE tb_grup.grup_slug = ? ORDER BY tb_dataset.created_at DESC', [grup_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT *, tb_dataset.created_at as datasetCreated FROM tb_grup RIGHT JOIN tb_dataset ON tb_grup.grup_id = tb_dataset.grup_id WHERE tb_grup.grup_slug = ? GROUP BY tb_dataset.dataset_id ORDER BY tb_dataset.created_at DESC', [grup_slug], function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

module.exports = router;