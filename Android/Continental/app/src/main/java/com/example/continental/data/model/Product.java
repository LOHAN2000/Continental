package com.example.continental.data.model;

public class Product {

    private long idProducto;
    private long idCategoria;

    private String categoria;
    private String codigoBarras;
    private String nombre;
    private String descripcion;

    private double precioCompra;
    private double precioVenta;
    private double stockActual;
    private double stockMinimo;

    private boolean controlaVencimiento;
    private boolean activo;

    private String estadoStock;

    public long getIdProducto() {
        return idProducto;
    }

    public long getIdCategoria() {
        return idCategoria;
    }

    public String getCategoria() {
        return categoria;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public double getPrecioCompra() {
        return precioCompra;
    }

    public double getPrecioVenta() {
        return precioVenta;
    }

    public double getStockActual() {
        return stockActual;
    }

    public double getStockMinimo() {
        return stockMinimo;
    }

    public boolean isControlaVencimiento() {
        return controlaVencimiento;
    }

    public boolean isActivo() {
        return activo;
    }

    public String getEstadoStock() {
        return estadoStock;
    }
}
