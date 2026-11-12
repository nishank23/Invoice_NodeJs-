const Product = require('../models/ProductModels/product');
const User = require('../models/UserModels/user');

// Get all products
const getProducts = async (req, res) => {
    try {
        const userId = req.userId;
        const products = await Product.find({ userId });
        res.json({ success: true, productData: products });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a specific product by ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(400).json({ error: 'Product not found' });
        }
        if (product.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to view this product' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new product
const createProduct = async (req, res) => {
    try {
        const { name, price, productCurrency, description, currencySymbol } = req.body;
        const userId = req.userId;

        const images = (req.files || []).map((file) => file.path);

        const newProduct = new Product({
            name,
            price,
            productCurrency,
            description,
            images,
            currencySymbol,
            userId: userId
        });

        const product = await newProduct.save();
        res.status(201).json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getProductCountByUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const productCount = await Product.countDocuments({ userId });
        res.json({ user: user.username, productCount });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { name, price, productCurrency, description, currencySymbol } = req.body;
        const images = (req.files || []).map((file) => file.path);

        const existing = await Product.findById(req.params.id);
        if (!existing) {
            return res.status(400).json({ error: 'Product not found' });
        }
        if (existing.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to update this product' });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { name, price, productCurrency, description, images, currencySymbol },
            { new: true }
        );

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const existing = await Product.findById(req.params.id);
        if (!existing) {
            return res.status(400).json({ error: 'Product not found' });
        }
        if (existing.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this product' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    getProductCountByUser,
    updateProduct,
    deleteProduct
};
