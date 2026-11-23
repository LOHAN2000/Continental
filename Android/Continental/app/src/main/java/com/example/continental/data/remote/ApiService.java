package com.example.continental.data.remote;

import com.example.continental.data.model.AlertActionResponse;
import com.example.continental.data.model.AlertsResponse;
import com.example.continental.data.model.CreateSaleRequest;
import com.example.continental.data.model.InventoryResponse;
import com.example.continental.data.model.InventorySummaryResponse;
import com.example.continental.data.model.KardexResponse;
import com.example.continental.data.model.LoginRequest;
import com.example.continental.data.model.LoginResponse;
import com.example.continental.data.model.ProductResponse;
import com.example.continental.data.model.ProductsResponse;
import com.example.continental.data.model.SaleResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {

    @POST("api/auth/login")
    Call<LoginResponse> login(
            @Body LoginRequest request
    );

    @GET("api/productos")
    Call<ProductsResponse> getProducts(
            @Query("search") String search,
            @Query("idCategoria") Long idCategoria,
            @Query("includeInactive") boolean includeInactive
    );

    @GET("api/productos/codigo/{codigoBarras}")
    Call<ProductResponse> getProductByBarcode(
            @Path("codigoBarras") String codigoBarras
    );

    @POST("api/ventas")
    Call<SaleResponse> createSale(
            @Body CreateSaleRequest request
    );

    @GET("api/inventario")
    Call<InventoryResponse> getInventory(
            @Query("search") String search,
            @Query("idCategoria") Long idCategoria,
            @Query("estado") String estado,
            @Query("includeInactive") boolean includeInactive
    );

    @GET("api/inventario/resumen")
    Call<InventorySummaryResponse> getInventorySummary();

    @GET("api/inventario/{idProducto}/kardex")
    Call<KardexResponse> getProductKardex(
            @Path("idProducto") long idProducto,
            @Query("fechaInicio") String fechaInicio,
            @Query("fechaFin") String fechaFin
    );

    @GET("api/alertas")
    Call<AlertsResponse> getAlerts(
            @Query("tipo") String tipo,
            @Query("leida") Boolean leida,
            @Query("includeInactive") boolean includeInactive
    );

    @PATCH("api/alertas/{idAlerta}/leer")
    Call<AlertActionResponse> markAlertAsRead(
            @Path("idAlerta") long idAlerta
    );
}
