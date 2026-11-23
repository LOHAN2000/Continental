package com.example.continental.data.model;

import java.util.List;

public class CreateSaleRequest {

    private final String observacion;
    private final List<SaleDetailRequest> detalles;

    public CreateSaleRequest(String observacion, List<SaleDetailRequest> detalles) {
        this.observacion = observacion;
        this.detalles = detalles;
    }

    public String getObservacion() {
        return observacion;
    }

    public List<SaleDetailRequest> getDetalles() {
        return detalles;
    }
}
