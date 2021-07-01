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
    destination: path.join(__dirname + './../public/upload/infografisGambar'),
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage });

router.get('/', async function (req, res, next) {

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_infografis', function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT * FROM tb_infografis', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

router.get('/:id', function (req, res, next) {

    var infografis_slug = req.params.id;

    connection.query('SELECT * FROM tb_infografis WHERE infografis_slug = ?', [infografis_slug],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', 1, rows[0], res);
            }
        });
});

router.post('/', auth, upload.single('infografis_foto'), async function (req, res, next) {

    let infografis_nama = req.body.infografis_nama;
    let infografis_slug = slugify(infografis_nama.toLowerCase());
    let infografis_foto = req.file === undefined ? "" : req.file.filename;
    let infografis_deskripsi = req.body.infografis_deskripsi;

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
        connection.query('SELECT COUNT(*) AS cnt FROM tb_infografis WHERE infografis_slug = ?', [infografis_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    if (check > 0) {
        response.error(false, "Nama infografis Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('INSERT INTO tb_infografis (infografis_nama, infografis_slug, infografis_foto, infografis_deskripsi) values(?, ?, ?, ?)', [infografis_nama, infografis_slug.toLowerCase(), infografis_foto, infografis_deskripsi], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Menambahkan Data!", 1, 'success', res);
            }
        })
    }

});

router.put('/', auth, upload.single('infografis_foto'), async function (req, res, next) {

    let infografis_id = req.body.infografis_id;
    let infografis_nama = req.body.infografis_nama;
    let infografis_slug = slugify(infografis_nama.toLowerCase());
    let infografis_deskripsi = req.body.infografis_deskripsi;

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
        connection.query('SELECT COUNT(infografis_id) AS cnt, infografis_foto, infografis_id FROM tb_infografis WHERE infografis_slug = ?', [infografis_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    let infografis_foto = req.file === undefined ? check.infografis_foto : req.file.filename;

    if (check.cnt > 0 && check.infografis_id != infografis_id) {
        response.error(false, "Nama infografis Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('UPDATE tb_infografis SET infografis_nama=?, infografis_slug=?, infografis_foto=?, infografis_deskripsi=? WHERE infografis_id=?', [infografis_nama, infografis_slug, infografis_foto, infografis_deskripsi, infografis_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Di Edit!", 1, 'success', res)
            }
        })
    }
});

router.delete('/:id', auth, async function (req, res) {
    var infografis_id = req.params.id;

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
        connection.query('SELECT * FROM tb_infografis WHERE infografis_id = ?', [infografis_id], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    fs.unlink("./public/upload/infografisGambar/" + check.infografis_foto, (err) => {
        if (err) {
            console.log("failed to delete local image:" + err);
        } else {
            console.log('successfully deleted local image');
            connection.query('DELETE FROM tb_infografis WHERE infografis_id=?', [infografis_id], function (error, rows, field) {
                if (error) {
                    console.log(error)
                } else {
                    response.ok(true, "Berhasil Menghapus Data!!", 1, 'success', res)
                }
            })
        }
    });
});

// Get Dataset Berdasarkan infografis

router.get('/dataset/:slug', async function (req, res, next) {

    var infografis_slug = req.params.slug;

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(tb_dataset.dataset_id) AS cnt, tb_infografis.* FROM tb_infografis RIGHT JOIN tb_dataset ON tb_infografis.infografis_id = tb_dataset.infografis_id WHERE tb_infografis.infografis_slug = ? ORDER BY tb_dataset.created_at DESC', [infografis_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT *, tb_dataset.created_at as datasetCreated FROM tb_infografis RIGHT JOIN tb_dataset ON tb_infografis.infografis_id = tb_dataset.infografis_id WHERE tb_infografis.infografis_slug = ? GROUP BY tb_dataset.dataset_id ORDER BY tb_dataset.created_at DESC', [infografis_slug], function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

module.exports = router;