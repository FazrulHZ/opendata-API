var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

var response = require('../helper/response');
var connection = require('../helper/connection');
var config = require('../helper/config');

router.post('/', async function (req, res, next) {

    let user = req.body.user;
    let user_password = req.body.user_password;

    const cekEmail = await new Promise(resolve => {
        connection.query('SELECT COUNT(user_email) AS cnt, user_id FROM tb_user WHERE user_email = ?', [user], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    const cekUsernama = await new Promise(resolve => {
        connection.query('SELECT COUNT(user_nama) AS cnt, user_id FROM tb_user WHERE user_nama = ?', [user], function (error, rows, field) {
            if (error) {
                console.log(error)
            } else {
                resolve(rows[0]);
            }
        });
    });

    if (cekEmail.cnt > 0) {

        //Yang Mo Return
        let token = await jwt.sign({ id: cekEmail.user_id }, config.secret, {
            expiresIn: 86400 // expires in 24 hours
        });

        const hash = await new Promise(resolve => {
            connection.query('SELECT user_password AS pass FROM tb_user WHERE user_email = ?', [user], function (error, rows, field) {
                if (error) {
                    console.log(error)
                } else {
                    if (rows.length == 0) {
                        response.error404(res);
                    } else {
                        resolve(rows[0].pass);
                    }
                }
            });
        });

        var cekpass = bcrypt.compareSync(user_password, hash);

        if (cekpass) {
            connection.query('SELECT * FROM tb_user WHERE user_email = ?', [user], function (error, rows, field) {
                if (error) {
                    console.log(error);
                } else {
                    response.ok(true, "Berhasil Menambahkan Data!", 1, { identitas: rows[0], token: token }, res);
                }
            })
        } else {
            response.error(false, "Password Anda Salah!", 'empty', res);
        }

    } else {

        if (cekUsernama.cnt > 0) {

            //Yang Mo Return
            let token = await jwt.sign({ id: cekUsernama.user_id }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });

            const hash = await new Promise(resolve => {
                connection.query('SELECT user_password AS pass FROM tb_user WHERE user_nama = ?', [user], function (error, rows, field) {
                    if (error) {
                        console.log(error)
                    } else {
                        if (rows.length == 0) {
                            response.error404(res);
                        } else {
                            resolve(rows[0].pass);
                        }
                    }
                });
            });

            var cekpass = bcrypt.compareSync(user_password, hash);

            if (cekpass) {
                connection.query('SELECT * FROM tb_user WHERE user_nama = ?', [user], function (error, rows, field) {
                    if (error) {
                        console.log(error);
                    } else {
                        response.ok(true, "Berhasil Menambahkan Data!", 1, { identitas: rows[0], token: token }, res);
                    }
                })
            } else {
                response.error(false, "Password Anda Salah!", 'empty', res);
            }

        } else {
            response.error(false, "Email Atau Username Tidak Terdaftar!", 'empty', res);
        }
    }

});

module.exports = router;