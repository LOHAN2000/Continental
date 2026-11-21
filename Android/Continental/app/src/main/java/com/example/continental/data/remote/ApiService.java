package com.example.continental.data.remote;

import com.example.continental.data.model.LoginRequest;
import com.example.continental.data.model.LoginResponse;
import com.example.continental.data.model.ProductsResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
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
}
