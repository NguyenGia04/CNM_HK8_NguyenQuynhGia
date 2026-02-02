const express = require("express");
const app = express();
const productRoutes = require("./routes/productRoutes");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // Để đọc data từ form
app.use(express.static("public"));
// Routes
app.use("/products", productRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server chạy tại: http://localhost:${PORT}/products`);
});