const express = require('express');
const router = express.Router();
const db = require('../db/mysql');

// Home
router.get('/', async(req, res) => {
    const [rows] = await db.query('SELECT * FROM products');
    res.render('products', { products: rows });
});

// Add product
router.post('/add', async(req, res) => {
    const { name, price, quantity } = req.body;
    await db.query(
        'INSERT INTO products(name, price, quantity) VALUES (?, ?, ?)', [name, price, quantity]
    );
    res.redirect('/');
});

// delete
router.get('/delete/:id', async(req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.redirect('/');
});
// update
router.get('/edit/:id', async(req, res) => {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.render('edit', { product: rows[0] });
});


router.post('/update/:id', async(req, res) => {
    const { id } = req.params;
    const { name, price, quantity } = req.body;
    await db.query(
        'UPDATE products SET name = ?, price = ?, quantity = ? WHERE id = ?', [name, price, quantity, id]
    );
    res.redirect('/');
});

//tim kiem
router.get('/', async(req, res) => {
    const { q } = req.query;
    let sql = 'SELECT * FROM products';
    let params = [];

    if (q) {
        sql += ' WHERE name LIKE ?';
        params.push(`%${q}%`);
    }

    const [rows] = await db.query(sql, params);

    res.render('products', {
        products: rows,
        searchQuery: q || ''
    });
});
module.exports = router;