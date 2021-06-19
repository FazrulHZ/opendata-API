var express = require('express');
var router = express.Router();
var path = require('path');

let slugify = require('slugify')

var response = require('../helper/response');
var connection = require('../helper/connection');
var auth = require('../helper/auth');

router.get('/', async function (req, res, next) {

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_dataset', function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT tb_dataset.*, tb_organisasi.org_nama, tb_grup.grup_nama FROM tb_dataset LEFT JOIN tb_organisasi ON tb_dataset.org_id = tb_organisasi.org_id LEFT JOIN tb_grup ON tb_dataset.grup_id = tb_grup.grup_id ORDER BY tb_dataset.created_at DESC', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

router.get('/grup', async function (req, res, next) {

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_grup', function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT tb_grup.*, COUNT(tb_dataset.grup_id) as totalDataset FROM tb_dataset RIGHT JOIN tb_grup ON tb_dataset.grup_id = tb_grup.grup_id GROUP BY tb_dataset.grup_id ORDER BY tb_grup.grup_nama ASC', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

router.get('/organisasi', async function (req, res, next) {

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_organisasi', function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT tb_organisasi.*, COUNT(tb_dataset.org_id) as totalDataset FROM `tb_dataset` RIGHT JOIN tb_organisasi ON tb_dataset.org_id = tb_organisasi.org_id GROUP BY tb_dataset.org_id ORDER BY tb_organisasi.org_nama ASC', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

router.get('/:slug', function (req, res, next) {

    var dataset_slug = req.params.slug;

    connection.query('SELECT tb_dataset.*, tb_organisasi.org_nama, tb_organisasi.org_ket, tb_grup.grup_nama FROM tb_dataset LEFT JOIN tb_organisasi ON tb_dataset.org_id = tb_organisasi.org_id LEFT JOIN tb_grup ON tb_dataset.grup_id = tb_grup.grup_id WHERE dataset_slug = ?', [dataset_slug],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', 1, rows[0], res);
            }
        });
});

router.get('/user/dataset', auth, async function (req, res, next) {

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

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_dataset WHERE org_id = ?', [cekAuth.org_id], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT * FROM tb_dataset WHERE org_id = ?', [cekAuth.org_id],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', count, rows, res);
            }
        });
});

router.post('/', auth, async function (req, res, next) {

    let dataset_nama = req.body.dataset_nama;
    let dataset_slug = slugify(dataset_nama.toLowerCase());
    let dataset_sumber = req.body.dataset_sumber;
    let dataset_cakupan = req.body.dataset_cakupan;
    let dataset_deskripsi = req.body.dataset_deskripsi;
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
        connection.query('INSERT INTO tb_dataset (dataset_nama, dataset_slug, dataset_sumber, dataset_cakupan, dataset_deskripsi, org_id, grup_id) values(?, ?, ?, ?, ?, ?, ?)', [dataset_nama, dataset_slug.toLowerCase(), dataset_sumber, dataset_cakupan, dataset_deskripsi, org_id, grup_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Menambahkan Data!", 1, 'success', res);
            }
        })
    }

});

router.put('/', auth, async function (req, res, next) {

    let dataset_id = req.body.dataset_id;
    let dataset_nama = req.body.dataset_nama;
    let dataset_slug = slugify(dataset_nama.toLowerCase());
    let dataset_sumber = req.body.dataset_sumber;
    let dataset_cakupan = req.body.dataset_cakupan;
    let dataset_deskripsi = req.body.dataset_deskripsi;
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
        connection.query('UPDATE tb_dataset SET dataset_nama=?, dataset_slug=?, dataset_sumber=?, dataset_cakupan=?, dataset_deskripsi=?, org_id=?, grup_id=? WHERE dataset_id=?', [dataset_nama, dataset_slug, dataset_sumber, dataset_cakupan, dataset_deskripsi, org_id, grup_id, dataset_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Di Edit!", 1, 'success', res)
            }
        })
    }
});

router.delete('/:id', auth, async function (req, res) {
    var dataset_id = req.params.id;

    connection.query('DELETE FROM tb_dataset WHERE dataset_id=?', [dataset_id], function (error, rows, field) {
        if (error) {
            console.log(error)
        } else {
            response.ok(true, "Berhasil Menghapus Data!!", 1, 'success', res)
        }
    })
});

// Cari Data

router.post('/cari', async function (req, res, next) {

    var dataset_nama = req.body.dataset_nama;

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_dataset WHERE dataset_nama LIKE ?', ['%' + dataset_nama + '%'], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT * FROM tb_dataset LEFT JOIN tb_organisasi ON tb_dataset.org_id = tb_organisasi.org_id LEFT JOIN tb_grup ON tb_dataset.grup_id = tb_grup.grup_id WHERE dataset_nama LIKE ?', ['%' + dataset_nama + '%'],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', count, rows, res);
            }
        });
});

module.exports = router;