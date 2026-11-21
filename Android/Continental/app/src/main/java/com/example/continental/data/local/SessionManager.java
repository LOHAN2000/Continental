package com.example.continental.data.local;

import android.content.Context;
import android.content.SharedPreferences;

import com.example.continental.data.model.SessionUser;

public class SessionManager {

    private static final String PREFERENCES_NAME = "continental_session";
    private static final String KEY_TOKEN = "jwt_token";
    private static final String KEY_EXPIRATION = "token_expiration";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_EMAIL = "user_email";
    private static final String KEY_USER_ROLE = "user_role";

    private final SharedPreferences preferences;

    public SessionManager(Context context) {
        preferences = context.getSharedPreferences(
                PREFERENCES_NAME,
                Context.MODE_PRIVATE
        );
    }

    public void saveSession(
            String token,
            String expiration,
            SessionUser user
    ) {
        preferences.edit()
                .putString(KEY_TOKEN, token)
                .putString(KEY_EXPIRATION, expiration)
                .putLong(
                        KEY_USER_ID,
                        user != null ? user.getIdUsuario() : 0
                )
                .putString(
                        KEY_USER_NAME,
                        user != null ? user.getNombres() : ""
                )
                .putString(
                        KEY_USER_EMAIL,
                        user != null ? user.getCorreo() : ""
                )
                .putString(
                        KEY_USER_ROLE,
                        user != null ? user.getRol() : ""
                )
                .apply();
    }

    public String getToken() {
        return preferences.getString(
                KEY_TOKEN,
                null
        );
    }

    public String getUserName() {
        return preferences.getString(
                KEY_USER_NAME,
                ""
        );
    }

    public String getUserEmail() {
        return preferences.getString(
                KEY_USER_EMAIL,
                ""
        );
    }

    public String getUserRole() {
        return preferences.getString(
                KEY_USER_ROLE,
                ""
        );
    }

    public boolean hasSession() {
        String token = getToken();

        return token != null &&
                !token.trim().isEmpty();
    }

    public boolean isOwner() {
        return "PROPIETARIO".equals(
                getUserRole()
        );
    }

    public void clearSession() {
        preferences.edit()
                .clear()
                .apply();
    }
}
