package com.example.continental.data.model;

public class SaleDetailRequest {

    private final long idProducto;
    private final double cantidad;

    public SaleDetailRequest(long idProducto, double cantidad) {
        this.idProducto = idProducto;
        this.cantidad = cantidad;
    }

    public long getIdProducto() {
        return idProducto;
    }

    public double getCantidad() {
        return cantidad;
    }
}
