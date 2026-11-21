package com.example.continental.data.repository;

import android.content.Context;

import com.example.continental.data.model.LoginRequest;
import com.example.continental.data.model.LoginResponse;
import com.example.continental.data.remote.ApiService;
import com.example.continental.data.remote.RetrofitClient;

import retrofit2.Call;

public class AuthRepository {

    private final ApiService apiService;

    public AuthRepository(Context context) {
        apiService = RetrofitClient.getApiService(context);
    }

    public Call<LoginResponse> login(String email, String password) {
        return apiService.login(
                new LoginRequest(email, password)
        );
    }
}
