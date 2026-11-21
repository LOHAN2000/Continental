package com.example.continental.data.remote;

import com.example.continental.data.model.LoginRequest;
import com.example.continental.data.model.LoginResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface ApiService {

    @POST("api/auth/login")
    Call<LoginResponse> login(
            @Body LoginRequest request
    );
}
