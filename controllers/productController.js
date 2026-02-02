const productModel = require("../models/productModel");

exports.getProducts = async (req, res) => {
    const products = await productModel.getAllProducts();
    res.render("products", { products: products }); 
};

exports.addProduct = async (req, res) => {
    const { id, name, price } = req.body;
    

    const url_image = req.file ? '/uploads/' + req.file.filename : '';

    // Lưu vào DynamoDB
    await productModel.createProduct({ 
        product_id: id, 
        name: name, 
        price: price,         
        url_image: url_image   
    });
    
    res.redirect("/products");
};

exports.deleteProduct = async (req, res) => {
    await productModel.deleteProduct(req.params.id);
    res.redirect("/products");
};

exports.getEditPage = async (req, res) => {
    const product = await productModel.getProductById(req.params.id);
    res.render("edit", { product: product });
};

exports.updateProduct = async (req, res) => {
    const { id, name, price, current_image } = req.body;

    let url_image = current_image;
    if (req.file) {
        url_image = '/uploads/' + req.file.filename;
    }

    await productModel.createProduct({ 
        product_id: id, 
        name: name, 
        price: price,
        url_image: url_image
    });
    
    res.redirect("/products");
};