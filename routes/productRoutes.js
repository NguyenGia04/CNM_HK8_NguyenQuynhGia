const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.get("/", productController.getProducts);
router.post("/", upload.single('image'), productController.addProduct);

router.get("/delete/:id", productController.deleteProduct);

router.get("/edit/:id", productController.getEditPage);
router.post("/update", upload.single('image'), productController.updateProduct);

module.exports = router;