package com.example.continental.data.model;

public class InventorySummary {

    private int totalProductosActivos;
    private int productosSinStock;
    private int productosConStockMinimo;
    private int productosDisponibles;

    private double unidadesDisponibles;
    private double valorInventarioCosto;
    private double valorInventarioVenta;

    public int getTotalProductosActivos() {
        return totalProductosActivos;
    }

    public int getProductosSinStock() {
        return productosSinStock;
    }

    public int getProductosConStockMinimo() {
        return productosConStockMinimo;
    }

    public int getProductosDisponibles() {
        return productosDisponibles;
    }

    public double getUnidadesDisponibles() {
        return unidadesDisponibles;
    }

    public double getValorInventarioCosto() {
        return valorInventarioCosto;
    }

    public double getValorInventarioVenta() {
        return valorInventarioVenta;
    }
}
