// import { Client, CreateBucketCommand } from '@aws-sdk/client-s3';

// const express = require('express');
import pkg from 'express';
const {express} = pkg;

// const app = express();

import bodyParser from 'body-parser';

// const bodyParser = require('body-parser');
// app.use(bodyParser.json());

import { S3Client } from '@aws-sdk/client-s3';

// const cors = require('cors');
// app.use(cors());

// const fs = require('fs');
// const serverindex = require("serve-index");
// const multer = require('multer');
// const Razorpay = require('razorpay');
// const AWS = require('aws-sdk');


// const mysql = require('mysql');
// const { error } = require('console');
// const { error } = require('console');

import pkg from 'mysql';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'f'
});
connection.connect((err) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Database Connected..")
    }
})
app.use(express.static("public"));

app.use(
    "/public",
    express.static("public"),
    serverindex("public", { icons: true }
    )
)

const awsconfig = {
    region: 'ap-south-1',
    accessKeyId: 'AKIA3FLDYW3SNGBP6HCP',
    secretAccessKey: 'TPNU/UyGkyofSzuZJiUtyI90gS5Y9k/HgeG0OLCQ',
    httpOptions: {
        timeout: 5000,
    }
};

const s3Client = new S3Client({ region: 'your-region' });

// const s3 = new AWS.S3(awsconfig);

// const razorpay = new Razorpay({
//     key_id: 'rzp_live_kFr6gQiD2PCk11',
//     key_secret: 'rzp_live_kFr6gQiD2PCk11',
// });


const uploadToS3 = (fileData) => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: "fourthdm-web-data",
            Key: `${Date.now().toString()}.jpg`,
            Body: fileData,
        };
        s3.upload(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });
};


const upload = multer({
    limits: {
        fileSize: 1024 * 1024 * 10,
    },
    fileFilter: function (req, file, done) {
        if (file.mimetype === "image/jpeg" ||
            file.mimetype === "image/png" ||
            file.mimetype === "image/gif" ||
            file.mimetype === "image/jpg" ||
            file.mimetype === "image/webp" ||
            file.mimetype === "application/pdf" ||
            file.mimetype === "video/mp4") {
            done(null, true);
        }
        else {
            var newError = new Error("file type incorrect");
            newError.name = "MulterError";
            done(newError, false);
        }
    }
});

app.post('/upload', upload.array('mainimage', 10), async (req, res) => {
    try {
        const product_id = req.body.product_id;
        const files = req.files;

        for (let file of files) {
            let path;
            await uploadToS3(file.buffer).then((res) => {
                path = res.Location;
            });

            const sql = ` insert into images (product_id,mainimage) values (?,?)`;
            const values = [product_id, path];

            connection.query(sql, values, (err, result) => {
                if (err) throw error;
                console.log('File added to database');
                console.log(result)
            });
        }
        res.send({ message: "files Uploaded Successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).send('An error Occured during file upload');
    }
});

app.get('/Showimages', (req, res) => {
    const sql = `select * from images`;
    connection.query(sql, (err, result) => {
        if (err) {
            res.send({
                success: false,
                error: err.sqlMessage,
                data: []
            })
        } else {
            res.send({
                success: true,
                error: '',
                data: result
            })
        }
    })
});

app.get('/', (req, res) => {
    res.send('Database  for attaching s3 bucket');
});



app.get('/Product', (req, res) => {
    const sql = `select * from product`;
    connection.query(sql, (err, data) => {
        if (err) {
            res.send({
                success: false,
                error: err.sql,
                data: []
            })
        } else {
            res.send({
                success: true,
                error: '',
                data: data
            })
        }
    })
});

app.post('/ADDProduct', (req, res) => {
    const Product_Name = req.body.Product_Name;
    const Weight = req.body.Weight;
    const Price = req.body.Price;
    const Brand_id = req.body.Brand_id;
    const Category_id = req.body.Category_id;

    const sql = `insert into product (Product_Name,Weight,Price,Brand_id,Category_id) value(?,?,?,?,?)`;
    connection.query(sql, [Product_Name, Weight, Price, Brand_id, Category_id], (err, data) => {
        if (err) {
            res.send({
                success: false,
                error: err.sqlMessage,
                data: []
            })
        } else {
            res.send({
                success: true,
                error: '',
                data: data
            })
        }
    })
});

app.listen(5000);