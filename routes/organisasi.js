var express = require('express');
var router = express.Router();

let slugify = require('slugify')

var response = require('../helper/response');
var connection = require('../helper/connection');

router.get('/', function (req, res, next) {
    connection.query('SELECT * FROM tb_organisasi', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok('Data Berhasil Diambil', rows, res);
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

router.post('/', async function (req, res, next) {

    let org_nama = req.body.org_nama;
    let org_slug = slugify(org_nama.toLowerCase());

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
        response.error("Nama Organisasi Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('INSERT INTO tb_organisasi (org_nama, org_slug) values(?, ?)', [org_nama, org_slug.toLowerCase()], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok("Berhasil Menambahkan Data!", 'success', res);
            }
        })
    }

});

router.put('/', async function (req, res, next) {

    let org_id = req.body.org_id;
    let org_nama = req.body.org_nama;
    let org_slug = slugify(org_nama.toLowerCase());

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
        response.error("Nama Organisasi Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('UPDATE tb_organisasi SET org_nama=?, org_slug=? WHERE org_id=?', [org_nama, org_slug, org_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok("Berhasil Di Edit!", 'success', res)
            }
        })
    }
});

router.delete('/:id', function (req, res) {
    var org_id = req.params.id;

    connection.query('DELETE FROM tb_organisasi WHERE org_id=?', [org_id], function (error, rows, field) {
        if (error) {
            console.log(error)
        } else {
            response.ok("Berhasil Menghapus Data!!", 'success', res)
        }
    })
});

module.exports = router;