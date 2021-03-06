var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
const fs = require('fs')
const papa = require('papaparse')

let slugify = require('slugify')

var response = require('../helper/response');
var connection = require('../helper/connection');
var auth = require('../helper/auth');

var storage = multer.diskStorage({
    destination: path.join(__dirname + './../public/upload/data'),
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage });

router.get('/', async function (req, res, next) {

    const count = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_data', function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    connection.query('SELECT * FROM tb_data LEFT JOIN tb_dataset ON tb_data.dataset_id = tb_dataset.dataset_id ORDER BY tb_data.created_at DESC', function (error, rows, field) {
        if (error) {
            console.log(error);
        } else {
            response.ok(true, 'Data Berhasil Diambil', count, rows, res);
        }
    });
});

router.get('/:slug', function (req, res, next) {

    var data_slug = req.params.slug;

    connection.query('SELECT * FROM tb_data LEFT JOIN tb_dataset ON tb_data.dataset_id = tb_dataset.dataset_id LEFT JOIN tb_organisasi ON tb_dataset.org_id = tb_organisasi.org_id LEFT JOIN tb_grup ON tb_dataset.grup_id = tb_grup.grup_id WHERE tb_data.data_slug = ? GROUP BY tb_data.data_id', [data_slug],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', 1, rows[0], res);
            }
        });
});

router.get('/dataset/:slug', function (req, res, next) {

    var dataset_slug = req.params.slug;

    connection.query('SELECT * FROM tb_data LEFT JOIN tb_dataset ON tb_data.dataset_id = tb_dataset.dataset_id WHERE tb_dataset.dataset_slug = ?', [dataset_slug],
        function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', 1, rows, res);
            }
        });
});

router.post('/', auth, upload.single('data_file'), async function (req, res, next) {

    let data_nama = req.body.data_nama;
    let data_slug = slugify(data_nama.toLowerCase());
    let data_ket = req.body.data_ket;
    let data_tahun = req.body.data_tahun;
    let data_file = req.file === undefined ? "" : req.file.filename;
    let dataset_id = req.body.dataset_id;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(*) AS cnt FROM tb_data WHERE data_slug = ?', [data_slug], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0].cnt);
            }
        });
    });

    if (check > 0) {
        response.error(false, "Data Telah Terdaftar!", 'empty', res);
    } else {
        connection.query('INSERT INTO tb_data (data_nama, data_slug, data_ket, data_tahun, data_file, dataset_id) values(?, ?, ?, ?, ?, ?)', [data_nama, data_slug.toLowerCase(), data_ket, data_tahun, data_file, dataset_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, "Berhasil Menambahkan Data!", 1, 'success', res);
            }
        })
    }

});

router.put('/', auth, upload.single('data_file'), async function (req, res, next) {

    let data_id = req.body.data_id;
    let data_nama = req.body.data_nama;
    let data_slug = slugify(data_nama.toLowerCase());
    let data_ket = req.body.data_ket;
    let data_tahun = req.body.data_tahun;
    let dataset_id = req.body.dataset_id;

    const check = await new Promise(resolve => {
        connection.query('SELECT COUNT(data_slug) AS cnt, data_file, data_id FROM tb_data WHERE data_id = ?', [data_id], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    console.log(check);

    let data_file = req.file === undefined ? check.data_file : req.file.filename;

    console.log(data_file);

    if (check > 0 && check.data_id != data_id) {
        response.error(false, "Data Telah Terdaftar!", 'empty', res);
    } else {

        if (check.data_file === "") {

            connection.query('UPDATE tb_data SET data_nama=?, data_slug=?, data_ket=?, data_tahun=?, data_file=?, dataset_id=? WHERE data_id=?', [data_nama, data_slug, data_ket, data_tahun, data_file, dataset_id, data_id], function (error, rows, field) {
                if (error) {
                    console.log(error);
                } else {
                    response.ok(true, "Berhasil Di Edit!", 1, 'success', res)
                }
            })

        } else {

            if (req.file === undefined) {

                connection.query('UPDATE tb_data SET data_nama=?, data_slug=?, data_ket=?, data_tahun=?, data_file=?, dataset_id=? WHERE data_id=?', [data_nama, data_slug, data_ket, data_tahun, data_file, dataset_id, data_id], function (error, rows, field) {
                    if (error) {
                        console.log(error);
                    } else {
                        response.ok(true, "Berhasil Di Edit!", 1, 'success', res)
                    }
                })

            } else {

                fs.unlink("./public/upload/data/" + check.data_file, (err) => {
                    if (err) {

                        console.log("failed to delete local file:" + err);

                    } else {

                        console.log('successfully deleted local file');
                        connection.query('UPDATE tb_data SET data_nama=?, data_slug=?, data_ket=?, data_tahun=?, data_file=?, dataset_id=? WHERE data_id=?', [data_nama, data_slug, data_ket, data_tahun, data_file, dataset_id, data_id], function (error, rows, field) {
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
    var data_id = req.params.id;

    const check = await new Promise(resolve => {
        connection.query('SELECT * FROM tb_data WHERE data_id = ?', [data_id], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    if (check.data_file === "") {
        connection.query('DELETE FROM tb_data WHERE data_id=?', [data_id], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                response.ok(true, "Berhasil Menghapus Data!!", 1, 'success', res)
            }
        })
    } else {
        fs.unlink("./public/upload/data/" + check.data_file, (err) => {
            if (err) {
                console.log("failed to delete local file:" + err);
            } else {
                console.log('successfully deleted local file');
                connection.query('DELETE FROM tb_data WHERE data_id=?', [data_id], function (error, rows, field) {
                    if (error) {
                        console.log(error)
                    } else {
                        response.ok(true, "Berhasil Menghapus Data!!", 1, 'success', res)
                    }
                })
            }
        });
    }
});

// PAPA PARSE
router.get('/papaparse/:file', function (req, res, next) {

    var filename = req.params.file;
    console.log(filename);

    let filePath = './public/upload/data/' + filename;
    const file = fs.createReadStream(filePath);

    papa.parse(file, {
        // download: true,
        // header: true,
        // step: function (results) {
        //     console.log(results.data);
        //     // console.log("Row errors:", results.errors);
        //     // response.ok(true, "Berhasil Di Edit!", 1, results.data, res)

        // }
        // // complete: function (results) {
        // //     console.log("All done!");
        // //     console.log('Complete ', results.data.length, ' records.');
        // // }

        download: true,
        header: true, // gives us an array of objects
        dynamicTyping: true,
        complete: (results) => {
            response.ok(true, "Berhasil Membaca Data CSV!", results.data.length, results, res)
        }
    });
});

// ADMIN

router.get('/admin/getdata', auth, async function (req, res, next) {

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

        const count = await new Promise(resolve => {
            connection.query('SELECT COUNT(*) AS cnt FROM tb_data LEFT JOIN tb_dataset ON tb_data.dataset_id = tb_dataset.dataset_id WHERE tb_dataset.org_id = ?', [cekAuth.org_id], function (error, rows, field) {
                if (error) {
                    console.log(error)
                } else {
                    resolve(rows[0].cnt);
                }
            });
        });

        connection.query('SELECT * FROM tb_data LEFT JOIN tb_dataset ON tb_data.dataset_id = tb_dataset.dataset_id WHERE tb_dataset.org_id = ? ORDER BY tb_data.created_at DESC', [cekAuth.org_id], function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', count, rows, res);
            }
        });

    } else {

        const count = await new Promise(resolve => {
            connection.query('SELECT COUNT(*) AS cnt FROM tb_data', function (error, rows, field) {
                if (error) {
                    console.log(error)
                } else {
                    resolve(rows[0].cnt);
                }
            });
        });

        connection.query('SELECT * FROM tb_data LEFT JOIN tb_dataset ON tb_data.dataset_id = tb_dataset.dataset_id ORDER BY tb_data.created_at DESC', function (error, rows, field) {
            if (error) {
                console.log(error);
            } else {
                response.ok(true, 'Data Berhasil Diambil', count, rows, res);
            }
        });
    }
});

module.exports = router;