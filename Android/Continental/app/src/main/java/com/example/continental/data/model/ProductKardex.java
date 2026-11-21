package com.example.continental.data.model;

import java.util.List;

public class ProductKardex {

    private long idProducto;
    private String codigoBarras;
    private String producto;
    private double stockActual;

    private List<InventoryMovement> movimientos;

    public long getIdProducto() {
        return idProducto;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public String getProducto() {
        return producto;
    }

    public double getStockActual() {
        return stockActual;
    }

    public List<InventoryMovement> getMovimientos() {
        return movimientos;
    }
}
