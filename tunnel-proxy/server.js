const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Universal logger
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.originalUrl);
  next();
});

// ✅ Sellers
app.use("/shops_app_sellers", createProxyMiddleware({
  target: "http://127.0.0.1:5002",
  changeOrigin: true,
  pathRewrite: (path, req) => {
    console.log("Rewriting Sellers path:", path);
    return path.replace(/^\/shops_app_sellers/, '');
  },
  onProxyReq(proxyReq, req, res) {
    console.log("Forwarding to Seller backend");
  },
  onError(err, req, res) {
    console.error("Seller proxy error:", err.message);
    res.status(500).send("Seller proxy error: " + err.message);
  }
}));

// ✅ Buyers
app.use("/shops_app_buyers", createProxyMiddleware({
  target: "http://127.0.0.1:5001",
  changeOrigin: true,
  pathRewrite: (path, req) => {
    console.log("Rewriting Buyers path:", path);
    return path.replace(/^\/shops_app_buyers/, '');
  },
  onProxyReq(proxyReq, req, res) {
    console.log("Forwarding to Buyer backend");
  },
  onError(err, req, res) {
    console.error("Buyer proxy error:", err.message);
    res.status(500).send("Buyer proxy error: " + err.message);
  }
}));

// ✅ Admin
app.use("/shops_app_Admin", createProxyMiddleware({
  target: "http://127.0.0.1:5000",
  changeOrigin: true,
  pathRewrite: (path, req) => {
    console.log("Rewriting Admin path:", path);
    return path.replace(/^\/shops_app_Admin/, '');
  },
  onProxyReq(proxyReq, req, res) {
    console.log("Forwarding to Admin backend");
  },
  onError(err, req, res) {
    console.error("Admin proxy error:", err.message);
    res.status(500).send("Admin proxy error: " + err.message);
  }
}));

// ✅ Start proxy server
app.listen(8080, () => {
  console.log("Proxy server running at http://localhost:8080");
});
