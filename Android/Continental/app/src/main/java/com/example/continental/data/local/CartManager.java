package com.example.continental.data.local;

import com.example.continental.data.model.Product;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class CartManager {

    public static class CartItem {

        private final Product product;
        private double quantity;

        public CartItem(Product product, double quantity) {
            this.product = product;
            this.quantity = quantity;
        }

        public Product getProduct() {
            return product;
        }

        public double getQuantity() {
            return quantity;
        }

        public void setQuantity(double quantity) {
            this.quantity = quantity;
        }

        public double getSubtotal() {
            return quantity * product.getPrecioVenta();
        }
    }

    private static CartManager instance;

    private final List<CartItem> items = new ArrayList<>();

    private CartManager() {
    }

    public static synchronized CartManager getInstance() {
        if (instance == null) {
            instance = new CartManager();
        }

        return instance;
    }

    public List<CartItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public String addProduct(Product product) {
        if (product == null) {
            return "El producto no es válido.";
        }

        if (!product.isActivo()) {
            return "El producto está inactivo.";
        }

        if (product.getStockActual() <= 0) {
            return "El producto no tiene stock.";
        }

        for (CartItem item : items) {
            if (item.getProduct().getIdProducto() == product.getIdProducto()) {
                double newQuantity = item.getQuantity() + 1;

                if (newQuantity > product.getStockActual()) {
                    return "No existe stock suficiente.";
                }

                item.setQuantity(newQuantity);
                return null;
            }
        }

        items.add(new CartItem(product, 1));
        return null;
    }

    public String updateQuantity(long productId, double quantity) {
        for (CartItem item : items) {
            if (item.getProduct().getIdProducto() == productId) {
                if (quantity <= 0) {
                    removeProduct(productId);
                    return null;
                }

                if (quantity > item.getProduct().getStockActual()) {
                    return "Solo hay " +
                            formatNumber(item.getProduct().getStockActual()) +
                            " unidad(es) disponibles.";
                }

                item.setQuantity(quantity);
                return null;
            }
        }

        return "El producto no está en el carrito.";
    }

    public void removeProduct(long productId) {
        items.removeIf(item -> item.getProduct().getIdProducto() == productId);
    }

    public double getTotal() {
        double total = 0;
        for (CartItem item : items) {
            total += item.getSubtotal();
        }
        return total;
    }

    public double getTotalUnits() {
        double total = 0;
        for (CartItem item : items) {
            total += item.getQuantity();
        }
        return total;
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public void clear() {
        items.clear();
    }

    private String formatNumber(double value) {
        if (value == Math.floor(value)) {
            return String.valueOf((long) value);
        }

        return String.valueOf(value);
    }
}
