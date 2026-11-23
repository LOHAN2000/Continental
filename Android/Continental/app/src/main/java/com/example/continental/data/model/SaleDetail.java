package com.example.continental.data.model;

public class SaleDetail {

    private long idVentaDetalle;
    private long idProducto;

    private String producto;
    private String codigoBarras;
    private String codigoLote;

    private double cantidad;
    private double precioUnitario;
    private double subtotal;

    public long getIdVentaDetalle() {
        return idVentaDetalle;
    }

    public long getIdProducto() {
        return idProducto;
    }

    public String getProducto() {
        return producto;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public String getCodigoLote() {
        return codigoLote;
    }

    public double getCantidad() {
        return cantidad;
    }

    public double getPrecioUnitario() {
        return precioUnitario;
    }

    public double getSubtotal() {
        return subtotal;
    }
}
