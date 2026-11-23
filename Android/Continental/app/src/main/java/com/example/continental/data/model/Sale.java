package com.example.continental.data.model;

import java.util.List;

public class Sale {

    private long idVenta;
    private String usuario;
    private String fecha;

    private double total;
    private String estado;
    private String observacion;

    private List<SaleDetail> detalles;

    public long getIdVenta() {
        return idVenta;
    }

    public String getUsuario() {
        return usuario;
    }

    public String getFecha() {
        return fecha;
    }

    public double getTotal() {
        return total;
    }

    public String getEstado() {
        return estado;
    }

    public String getObservacion() {
        return observacion;
    }

    public List<SaleDetail> getDetalles() {
        return detalles;
    }
}
