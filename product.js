

app.post('/Addproduct', (req, res) => {
    const Product_Name = req.body.Product_Name;
    const Weight = req.body.Weight;
    const Price = req.body.Price;
    const discount = req.body.discount;
    const Amount = req.body.Amount;
    const pricewithdiscount = req.body.pricewithdiscount;
    const Brand_id = req.body.Brand_id;
    const Category_id = req.body.Category_id;
    const description = req.body.description;
    const benefits = req.body.benefits;
    const ingredients = req.body.ingredients;
    const sql = `insert into product (Product_Name,Weight,Price,discount,pricewithdiscount,Brand_id,Category_id,description,benefits,ingredients) value(?,?,?,?,?,price - (price * (discount / 100)),?,?,?,?)`;
    connection.query(sql, [Product_Name, Weight, Price, discount,pricewithdiscount, Brand_id,  Category_id, description, benefits, ingredients], (err, data) => {
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
})