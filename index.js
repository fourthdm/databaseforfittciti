// import { Client, CreateBucketCommand } from '@aws-sdk/client-s3';
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const jwt = require('jsonwebtoken');
const secret = 'FourthdmDimensionfhdfjsjfhkrekffkdjjgfjehieruitrjhgjkfig'

// import { S3Client } from '@aws-sdk/client-s3';
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const cors = require('cors');
app.use(cors());
const fs = require('fs');
const serverindex = require("serve-index");
const multer = require('multer');
const Razorpay = require('razorpay');
const AWS = require('aws-sdk');

const mysql = require('mysql');
const { error } = require('console');
const { send } = require('process');
// const { error } = require('console');
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
    secretAccessKey: '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',
    httpOptions: {
        timeout: 5000,
    }
};

const s3Client = new S3Client({ region: 'ap-south-1' });

const s3 = new AWS.S3(awsconfig);

const razorpay = new Razorpay({
    key_id: 'rzp_live_kFr6gQiD2PCk11',
    key_secret: 'rzp_live_kFr6gQiD2PCk11',
});


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

// app.post('/upload', upload.array('mainimage', 10), async (req, res) => {
//     try {
//         const product_id = req.body.product_id;
//         const files = req.files;
//         for (let file of files) {
//             console.log(file);
//             let path;
//             try {
//                 path = await uploadToS3(file.buffer);
//                 const sql = `INSERT INTO images (product_id, mainimage) VALUES (?, ?)`;
//                 const values = [product_id, path];
//                 await new Promise((resolve, reject) => {
//                     connection.query(sql, values, (err, result) => {
//                         if (err) {
//                             console.error('Error adding file to database:', err);
//                             reject(err);
//                         } else {
//                             console.log('File added to database');
//                             resolve();
//                         }
//                     });
//                 });
//             } catch (err) {
//                 console.error('Error adding file to S3 or database:', err);
//                 return res.status(500).send('An error occurred during file upload');
//             }
//         }
//         res.send({
//             success: true,
//             message: "Files uploaded successfully"
//         });
//     } catch (err) {
//         console.error('Error handling file upload:', err);
//         res.status(500).send('An error occurred during file upload');
//     }
// });

app.post('/upload', upload.array('mainimage', 10), async (req, res) => {
    try {
        const product_id = req.body.product_id;
        const files = req.files;
        for (let file of files) {
            console.log(file);
            let path;
            await uploadToS3(file.buffer).then((res) => {
                path = res.Location;
            });
            const sql = `INSERT INTO images (product_id, mainimage) VALUES (?, ?)`;
            const values = [product_id, path];

            connection.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error adding file to database:', err);
                    return res.status(500).send('An error occurred while adding file to database');
                }
                console.log('File added to database');
            });
        }
        res.send({
            success: true,
            message: "Files uploaded successfully"
        });
    } catch (err) {
        console.error('Error handling file upload:', err);
        res.status(500).send('An error occurred during file upload');
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

app.get('/imagesbyid/:product_id', (req, res) => {
    const product_id = req.params.product_id;
    const sqlll = `select * from images where product_id=?`;
    connection.query(sqlll, [product_id], (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'Images of specific product',
                data: data
            })
        }
    })
});

app.get('/', (req, res) => {
    res.send('Database  for attaching s3 bucket');
});

app.get('/Productwithimages', (req, res) => {
    const sqll = `select product.*, images.mainimage
                    from product 
                    inner join images on product.id = images.product_id  where  images.product_id`;
    connection.query(sqll, (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: '',
                data: data
            })
        }
    })
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
    // const discount = req.body.discount;
    // const Amount = req.body.Amount;
    const Brand_id = req.body.Brand_id;
    const Category_id = req.body.Category_id;
    const description = req.body.description;
    const benefits = req.body.benefits;
    const ingredients = req.body.ingredients;
    const sql = `insert into product (Product_Name,Weight,Price,Brand_id,Category_id,description,benefits,ingredients) value(?,?,?,?,?,?,?,?)`;
    connection.query(sql, [Product_Name, Weight, Price, Brand_id, Category_id, description, benefits, ingredients], (err, data) => {
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

app.post('/Productbycategoryandbrand', (req, res) => {
    const Category_id = req.body.Category_id;
    const Brand_id = req.body.Brand_id;
    const sql = `select product.Product_Name,product.Price,product.Weight,product.description,product.benefits,product.ingredients
                brand.Brand_Name, category.Category_Name
                from((product
                inner join brand on product.Category_id = brand.Brand_id)
                inner join category on product.Category_id = category.Category_id) where product.Category_id=? and  product.Brand_id=? ;`
    connection.query(sql, [Category_id, Brand_id], (err, data) => {
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

app.put('/Updateproduct/:id', (req, res) => {
    const id = req.params.id
    const Product_Name = req.body.Product_Name;
    const Weight = req.body.Weight;
    const Price = req.body.Price;
    const Brand_id = req.body.Brand_id;
    const Category_id = req.body.Category_id;
    const description = req.body.description;
    const benefits = req.body.benefits;
    const ingredients = req.body.ingredients;
    const sql = `update product set Product_Name=?,Weight=?,Price=?,Brand_id=?,Category_id=?,description=?,benefits=?,ingredients=? where id=?`;
    connection.query(sql, [Product_Name, Weight, Price, Brand_id, Category_id, description, benefits, ingredients, id], (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'Product Updated.',
                data: data
            })
        }
    })
});

app.delete('/Deleteproduct/:id', (req, res) => {
    const id = req.params.id;
    const sql = `delete from product where id=?`;
    connection.query(sql, [id], (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'Product deleted successfully..',
                data: data
            })
        }
    })
});
//end the product api 


//start category apis
app.post('/addcategory', (req, res) => {
    const Category_Name = req.body.Category_Name;
    const sql = `insert into category (Category_Name) value(?)`;
    connection.query(sql, [Category_Name], (err, data) => {
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

app.get('/Allcategory', (req, res) => {
    const category = ` select * from category `;
    connection.query(category, (err, data) => {
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

app.get('/getbyid/:Category_id', (req, res) => {
    const Category_id = req.params.Category_id;
    const category = `select * from category where Category_id=?`;
    connection.query(category, [Category_id], (err, data) => {
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

app.put('/updatecategory/:Category_id', (req, res) => {
    const Category_id = req.params.Category_id;
    const Category_Name = req.body.Category_Name;
    const updatecategory = `update category set Category_Name=? where Category_id = ?`;
    connection.query(updatecategory, [Category_Name, Category_id], (err, data) => {
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

app.delete('/deletecategory/:Category_id', (req, res) => {
    const Category_id = req.params.Category_id;
    const query = `delete from category where Category_id=?`;
    connection.query(query, [Category_id], (err, data) => {
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
//end category api's

//apis for brands
app.post('/addbrand', (req, res) => {
    const Brand_Name = req.body.Brand_Name;
    const sql = `insert into brand (Brand_Name) value(?)`;
    connection.query(sql, [Brand_Name], (err, data) => {
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

app.get('/Allbrand', (req, res) => {
    const brands = `select * from brand`;
    connection.query(brands, (err, data) => {
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

app.get('/brandbyid/:Brand_id', (req, res) => {
    const Brand_id = req.params.Brand_id;
    const sql = `select * from brand where Brand_id = ? `;
    connection.query(sql, [Brand_id], (err, data) => {
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

app.put('/updatebrand/:Brand_id', (req, res) => {
    const Brand_id = req.params.Brand_id;
    const Brand_Name = req.body.Brand_Name;
    const update = ` update brand set Brand_Name=? where Brand_id=? `;
    connection.query(update, [Brand_Name, Brand_id], (err, data) => {
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

app.delete('/deletebrand/:Brand_id', (req, res) => {
    const Brand_id = req.params.Brand_id;
    const query = `delete from brand where Brand_id=?`;
    connection.query(query, [Brand_id], (err, data) => {
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
//Brand api ends

//enquiry form  api starts
app.post('/Contact', (req, res) => {
    const Name = req.body.Name;
    const Email = req.body.Email;
    const Mobileno = req.body.Mobileno;
    const Message = req.body.Message;
    const Date = req.body.Date;
    const sqll = `insert into enquiry (Name,Email,Mobileno,Message,Date) values(?,?,?,?,?) `;
    connection.query(sqll, [Name, Email, Mobileno, Message, Date], (err, result) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: "Enquiry form has been generated successfully",
                data: result.data
            })
        }
    });
});

app.get('/Allcontact', (req, res) => {
    const sqlll = `select * from enquiry `;
    connection.query(sqlll, (err, result) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            });
        } else {
            res.status(200).send({
                success: true,
                message: 'Data is retrived Successfully',
                data: result
            });
        }
    })
});

app.delete('/Deleteenquiry/:Id', (req, res) => {
    const Id = req.params.Id;
    const sql = `delete from  enquiry where Id=?`;
    connection.query(sql, [Id], (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'The Data Is Deleted!',
                data: data
            })
        }
    })
});

app.post('/Getenquirybydate', (req, res) => {
    const Date = req.body.Date;
    const sqll = `select * from enquiry where Date=?`;
    connection.query(sqll, [Date], (data, err) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: '',
                data: data
            })
        }
    })
});
//enquiry form api end

//Data for a user 
//Add a user by a Registeration form using a user post methods 
app.post('/Registeration', (req, res) => {
    const Name = req.body.Name;
    const Username = req.body.Username;
    const Password = req.body.Password;
    const Email = req.body.Email;
    const Address = req.body.Address;
    const Mobileno = req.body.Mobileno;
    const sql = `insert into user (Name,Username,Password,Email,Address,Mobileno) values (?,?,?,?,?,?)`;
    connection.query(sql, [Name, Username, Password, Email, Address, Mobileno], (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                error: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                error: '',
                data: data
            })
        }
    })
});

app.get('/ALLuser', (req, res) => {
    const sql = `select * from user`;
    connection.query(sql, (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                error: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                error: '',
                data: data
            })
        }
    })
});

app.get('/Information', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const sql = `select * from user where User_id=? `;
                connection.query(sql, [decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'User data',
                            data: result
                        })
                    }
                })
            }
        })
    }
})

app.post('/login', (req, res) => {
    const Username = req.body.Username;
    const Password = req.body.Password;
    const sql = `select * from user where Username=? and Password = ?`;
    connection.query(sql, [Username, Password], (err, result) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            if (result.length > 0) {
                const user = {
                    User_id: result[0].User_id,
                    Name: result[0].Name,
                    Username: result[0].Username,
                    Email: result[0].Email,
                    Address: result[0].Address,
                    Mobileno: result[0].Mobileno
                }
                const token = jwt.sign(user, secret, { expiresIn: '30d' });
                res.send({
                    success: true,
                    message: 'Login Successfully',
                    data: token
                })
            } else {
                res.status(400).send({
                    success: false,
                    message: 'User Not Found',
                    data: []
                })
            }
        }
    })
});

//API for carts table...
app.post('/AddCart', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const Product_id = req.body.Product_id;
                const Quantity = req.body.Quantity;
                // const Total = req.body.Total;

                // const sql = `insert into cart product.Product_Name, product.Price
                // from cart 
                // inner join product on cart.Product_id = product.id
                // where user_id=?;`
                const Total = `select cart.*, product.Product_Name, product.Price, SUM(cart.Quantity * product.Price)
                from cart 
                inner join product on cart.Product_id = product.id
                where user_id=?;`;
                const sql = `insert into cart (Product_id,User_id,Quantity,Total) values (?,?,?,Total)`;
                connection.query(sql, [Product_id, Quantity, Total, decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Product Add to Cart',
                            data: result
                        })
                    }
                })
            }
        })
    }
});

app.get('/cartbyuser', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const sql = `select cart.*, product.Product_Name, product.Price, SUM(cart.Quantity * product.Price)
                from cart 
                inner join product on cart.Product_id = product.id
                where user_id=?;`
                connection.query(sql, [decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Products in  Cart',
                            data: result
                        })
                    }
                })
            }
        })
    }
})

app.get('/Carts', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                //    const sql = `select cart.Cart_id ,cart.Product_id, product.Product_Name, product.Price, SUM(cart.Quantity * product.Price)
                //     from cart 
                //     inner join product on cart.Product_id = product.id
                //     where user_id=?;` 
                // const sql = `select * from cart where User_id=? `;
                const sql = `SELECT cart.Cart_id, cart.Product_id,cart.Quantity, product.Product_Name,product.Price, 
                    cart.Quantity * product.Price AS Total , cart.Total + cart.Total AS  GrandTotal 
                FROM cart 
                INNER JOIN product ON cart.Product_id = product.id
                WHERE cart.User_id = ?
                GROUP BY cart.Cart_id;`
                connection.query(sql, [decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Products in  Cart',
                            data: result
                        })
                    }
                })
            }
        })
    }
});

app.get('/CartsforAdmin', (req, res) => {
    const sql = `select * from cart`;
    connection.query(sql, (err, result) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'All Carts',
                data: result
            })
        }
    })
});

app.get('/Cartswithprice', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const sql = `select cart.*, product.Product_Name, product.Price
                              from cart 
                             inner join product on cart.Product_id = product.id  where  cart.User_id=?`
                // const sql = `select * from wishlist`;
                connection.query(sql, [decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Products are in Wishlist',
                            data: result
                        })
                    }
                })
            }
        })
    }
})

app.delete('/DeletebyProduct/:Product_id', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {

                const Product_id = req.params.Product_id;
                const sql = `delete from cart where Product_id = ?`;
                // const sql = `select * from wishlist`;
                connection.query(sql, [Product_id, decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Product deleted',
                            data: result
                        })
                    }
                })
            }
        })
    }
});

app.delete('/Emptycart/:Cart_id', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {

                const Cart_id = req.params.Cart_id;
                const sql = `delete from cart where Cart_id = ?`;
                // const sql = `select * from wishlist`;
                connection.query(sql, [Cart_id, decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Cart deleted',
                            data: result
                        })
                    }
                })
            }
        })
    }

    // const Cart_id = req.params.Cart_id;
    // const sql2 = `delete from cart where Cart_id = ?`;
    // connection.query(sql2, [Cart_id], (err, data) => {
    //     if (err) {
    //         res.status(500).send({
    //             success: false,
    //             message: err.sqlMessage,
    //             data: []
    //         })
    //     } else {
    //         res.status(200).send({
    //             success: true,
    //             message: 'Empty cart',
    //             data: data
    //         })
    //     }
    // })
});
//Api end of carts table

// API for Wishlist table Start......
app.post('/AddWishlist', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const Product_id = req.body.Product_id;
                const sql = `insert into wishlist (Product_id,User_id) values (?,?)`;
                connection.query(sql, [Product_id, decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Product Add to Wishlist',
                            data: result
                        })
                    }
                })
            }
        })
    }
});

app.delete('/Deleteproduct/:Product_id', (req, res) => {
    const Product_id = req.params.Product_id;
    const sql1 = `delete from wishlist where Product_id = ?`;
    connection.query(sql1, [Product_id], (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: "Successfully deleted the Product",
                data: data
            })
        }
    })
});

app.delete('/Deletewishlist/:Wishlist_id', (req, res) => {
    const Wishlist_id = req.params.Wishlist_id;
    const sqlw = `delete from wishlist  where Wishlist_id=?`;
    connection.query(sqlw, [Wishlist_id], (err, result) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'Wishlist Deleted',
                data: result
            })
        }
    })
});

app.delete('/Deletewshlistbyuser/:Wishlist_id', (req, res) => {
    const Wishlist_id = req.params.Wishlist_id
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const sql = `delete from wishlist where Wishlist_id=? and User_id=?`;
                connection.query(sql, [Wishlist_id, decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Product deleted by Wishlst',
                            data: result
                        })
                    }
                })
            }
        })
    }
})

app.get('/Wishlist', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const sql = `select wishlist.*, product.Product_Name
                             from wishlist 
                             inner join product on wishlist.Product_id = product.id
                             where user_id=?;`
                // const sql = `select * from wishlist`;
                connection.query(sql, [decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Products are in Wishlist',
                            data: result
                        })
                    }
                })
            }
        })
    }
});

app.get('/Allwishlist', (req, res) => {
    const sqll = `select * from  wishlist inner join product on wishlist.Product_id = product.id`;
    connection.query(sqll, (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'Wishlist of all users',
                data: data
            })
        }
    })
})

//API of wishlist table ends...

//Api for orddertable
app.post('/Adddorder', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const Order_date = req.body.Order_date;
                const Total_amount = req.body.Total_amount;
                const Shipping_address = req.body.Shipping_address;
                const Cart_id = req.body.Cart_id;


                const sql = `insert into orders (Order_date,Total_amount, Shipping_address,Cart_id,User_id) values (?,?,?,?,?)`;
                connection.query(sql, [Order_date, Total_amount, Shipping_address, Cart_id, decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Order Added Successfully',
                            data: result
                        })
                    }
                })
            }
        })
    }
});

app.get('/Orders/:User_id', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({
            success: false,
            message: 'unauthorized',
            data: []
        })
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'unauthorized',
                    data: []
                })
            } else {
                const sql = `select orders.*, cart.Product_id, product.Product_Name
                              from(( orders    
                             inner join cart on orders.Cart_id = cart.Cart_id)
                             inner join product on cart.Product_id=product.id) 
                             where orders.User_id=?;`

                connection.query(sql, [decoded.User_id], (err, result) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err.sqlMessage,
                            data: []
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            message: 'Your All Orders ',
                            data: result
                        })
                    }
                })
            }
        })
    }
})

app.get('/AllordersforAdmin', (req, res) => {
    const sql = `select * from orders`;
    connection.query(sql, (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'All Orders',
                data: data
            })
        }
    })
});

app.post('/OrdersBydate', (req, res) => {
    const Order_date = req.body.Order_date;
    const sql = `select * from orders where Order_date=?`;
    connection.query(sql, [Order_date], (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: "Showing order by date",
                data: data
            })
        }
    })
});

app.post('/Ordersbyuser_id', (req, res) => {
    const User_id = req.body.User_id;
    const sql = `select * from orders where  User_id=?`;
    connection.query(sql, [User_id], (err, data) => {
        if (err) {
            res.status(500).send({
                success: false,
                message: err.sqlMessage,
                data: []
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'Orders By User',
                data: data
            })
        }
    })
});

app.listen(5000);