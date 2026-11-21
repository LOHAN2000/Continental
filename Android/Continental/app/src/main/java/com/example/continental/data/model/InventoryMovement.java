package com.example.continental.data.model;

public class InventoryMovement {

    private long idMovimiento;

    private long idProducto;
    private String producto;
    private String codigoBarras;

    private long idUsuario;
    private String usuario;

    private String tipo;
    private Long referenciaId;

    private double entrada;
    private double salida;
    private double saldo;

    private String motivo;
    private String fecha;

    public long getIdMovimiento() {
        return idMovimiento;
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

    public long getIdUsuario() {
        return idUsuario;
    }

    public String getUsuario() {
        return usuario;
    }

    public String getTipo() {
        return tipo;
    }

    public Long getReferenciaId() {
        return referenciaId;
    }

    public double getEntrada() {
        return entrada;
    }

    public double getSalida() {
        return salida;
    }

    public double getSaldo() {
        return saldo;
    }

    public String getMotivo() {
        return motivo;
    }

    public String getFecha() {
        return fecha;
    }
}
