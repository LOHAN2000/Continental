package com.example.continental.data.model;

public class InventoryAlert {

    private long idAlerta;

    private long idProducto;
    private String producto;
    private String codigoBarras;

    private Long idLote;
    private String codigoLote;

    private String tipo;
    private String mensaje;

    private double stockActual;
    private double stockMinimo;

    private String fechaVencimiento;

    private boolean leida;
    private boolean activa;

    private String createdAt;

    public long getIdAlerta() {
        return idAlerta;
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

    public Long getIdLote() {
        return idLote;
    }

    public String getCodigoLote() {
        return codigoLote;
    }

    public String getTipo() {
        return tipo;
    }

    public String getMensaje() {
        return mensaje;
    }

    public double getStockActual() {
        return stockActual;
    }

    public double getStockMinimo() {
        return stockMinimo;
    }

    public String getFechaVencimiento() {
        return fechaVencimiento;
    }

    public boolean isLeida() {
        return leida;
    }

    public boolean isActiva() {
        return activa;
    }

    public String getCreatedAt() {
        return createdAt;
    }
}
