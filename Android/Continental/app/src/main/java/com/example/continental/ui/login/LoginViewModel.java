package com.example.continental.ui.login;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.example.continental.data.local.SessionManager;
import com.example.continental.data.model.ApiErrorResponse;
import com.example.continental.data.model.LoginResponse;
import com.example.continental.data.repository.AuthRepository;
import com.google.gson.Gson;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginViewModel extends AndroidViewModel {

    private final AuthRepository authRepository;
    private final SessionManager sessionManager;

    private final MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);
    private final MutableLiveData<String> errorMessage = new MutableLiveData<>();
    private final MutableLiveData<Boolean> loginSuccess = new MutableLiveData<>();

    public LoginViewModel(@NonNull Application application) {
        super(application);
        this.authRepository = new AuthRepository(application);
        this.sessionManager = new SessionManager(application);
    }

    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }

    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }

    public LiveData<Boolean> getLoginSuccess() {
        return loginSuccess;
    }

    public boolean hasActiveSession() {
        return sessionManager.hasSession();
    }

    public void login(String email, String password) {
        isLoading.setValue(true);
        errorMessage.setValue(null);

        authRepository.login(email, password).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(@NonNull Call<LoginResponse> call, @NonNull Response<LoginResponse> response) {
                isLoading.setValue(false);
                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    LoginResponse loginResponse = response.body();
                    sessionManager.saveSession(
                            loginResponse.getData().getToken(),
                            loginResponse.getData().getExpiration(),
                            loginResponse.getData().getUsuario()
                    );
                    loginSuccess.setValue(true);
                } else {
                    String error = "Credenciales incorrectas o error en el servidor";
                    if (response.errorBody() != null) {
                        try {
                            String errorJson = response.errorBody().string();
                            ApiErrorResponse apiError = new Gson().fromJson(errorJson, ApiErrorResponse.class);
                            if (apiError != null && apiError.getMessage() != null && !apiError.getMessage().trim().isEmpty()) {
                                error = apiError.getMessage();
                            }
                        } catch (Exception ignored) {
                        }
                    }
                    errorMessage.setValue(error);
                }
            }

            @Override
            public void onFailure(@NonNull Call<LoginResponse> call, @NonNull Throwable t) {
                isLoading.setValue(false);
                errorMessage.setValue("Error de conexión: " + (t.getMessage() != null ? t.getMessage() : "No se pudo conectar con el servidor"));
            }
        });
    }
}
