package com.example.continental.data.model;

public class InventoryItem {

    private long idProducto;
    private String codigoBarras;
    private String producto;

    private long idCategoria;
    private String categoria;

    private double stockActual;
    private double stockMinimo;

    private String estadoStock;

    private boolean controlaVencimiento;
    private double cantidadEnLotes;

    private String proximoVencimiento;
    private boolean activo;

    public long getIdProducto() {
        return idProducto;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public String getProducto() {
        return producto;
    }

    public long getIdCategoria() {
        return idCategoria;
    }

    public String getCategoria() {
        return categoria;
    }

    public double getStockActual() {
        return stockActual;
    }

    public double getStockMinimo() {
        return stockMinimo;
    }

    public String getEstadoStock() {
        return estadoStock;
    }

    public boolean isControlaVencimiento() {
        return controlaVencimiento;
    }

    public double getCantidadEnLotes() {
        return cantidadEnLotes;
    }

    public String getProximoVencimiento() {
        return proximoVencimiento;
    }

    public boolean isActivo() {
        return activo;
    }
}
