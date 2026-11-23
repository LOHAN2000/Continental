package com.example.continental.data.remote;

import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;

import com.example.continental.data.local.SessionManager;
import com.example.continental.ui.login.LoginActivity;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Response;

public class UnauthorizedInterceptor implements Interceptor {

    private final Context context;
    private final SessionManager sessionManager;

    public UnauthorizedInterceptor(Context context, SessionManager sessionManager) {
        this.context = context.getApplicationContext();
        this.sessionManager = sessionManager;
    }

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Response response = chain.proceed(chain.request());

        if (response.code() == 401) {
            sessionManager.clearSession();

            Intent intent = new Intent(context, LoginActivity.class);
            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TASK
            );

            context.startActivity(intent);
        }

        return response;
    }
}
