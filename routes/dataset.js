var express = require('express');
var router = express.Router();
var path = require('path');

let slugify = require('slugify')

var response = require('../helper/response');
var connection = require('../helper/connection');

router.get('/', function (req, res, next) {
    connection.query('SELECT * FROM tb_dataset LEFT JOIN tb_organisasi ON tb_dataset.org_id = tb_organisasi.org_id LEFT JOIN tb_grup ON tb_dataset.grup_id = tb_grup.grup_id ORDER BY tb_dataset.created_at', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', rows, res);
        }
    });
});

router.get('/:id', function (req, res, next) {

    var dataset_id = req.params.id;

    connection.query('SELECT * FROM tb_dataset LEFT JOIN tb_organisasi ON tb_dataset.org_id = tb_organisasi.org_id LEFT JOIN tb_grup ON tb_dataset.grup_id = tb_grup.grup_id WHERE dataset_id == ?', [dataset_id],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok('Data Berhasil Diambil', rows, res);
            }
        });
});

router.post('/', async function (req, res, next) {

    let dataset_nama = req.body.dataset_nama;
    let dataset_slug = slugify(dataset_nama.toLowerCase());
    let dataset_sumber = req.body.dataset_sumber;
    let dataset_cakupan = req.body.dataset_cakupan;
    let org_id = req.body.org_id;
    let grup_id = req.body.grup_id;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_dataset WHERE dataset_slug = ?', [dataset_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    if (check > 0) {
        response.error(false, "Dataset Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('INSERT INTO tb_dataset (dataset_nama, dataset_slug, dataset_sumber, dataset_cakupan, org_id, grup_id) values(?, ?, ?, ?, ?, ?)', [dataset_nama, dataset_slug.toLowerCase(), dataset_sumber, dataset_cakupan, org_id, grup_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Menambahkan Data!", 'success', res);
            }
        })
    }

});

router.put('/', async function (req, res, next) {

    let dataset_id = req.body.dataset_id;
    let dataset_nama = req.body.dataset_nama;
    let dataset_slug = slugify(dataset_nama.toLowerCase());
    let dataset_sumber = req.body.dataset_sumber;
    let dataset_cakupan = req.body.dataset_cakupan;
    let org_id = req.body.org_id;
    let grup_id = req.body.grup_id;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(dataset_slug) AS cnt, dataset_id FROM tb_dataset WHERE dataset_slug = ?', [dataset_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    if (check > 0 && check.dataset_id != dataset_id) {
        response.error(false, "Dataset Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('UPDATE tb_dataset SET dataset_nama=?, dataset_slug=?, dataset_sumber=?, dataset_cakupan=?, org_id=?, grup_id=? WHERE dataset_id=?', [dataset_nama, dataset_slug, dataset_sumber, dataset_cakupan, org_id, grup_id, dataset_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Di Edit!", 'success', res)
            }
        })
    }
});

router.delete('/:id', async function (req, res) {
    var dataset_id = req.params.id;

    connection.query('DELETE FROM tb_dataset WHERE dataset_id=?', [dataset_id], function (error, rows, field) {
        if (error) {
            console.log(error)
        } else {
            response.ok(true, "Berhasil Menghapus Data!!", 'success', res)
        }
    })
});

module.exports = router;