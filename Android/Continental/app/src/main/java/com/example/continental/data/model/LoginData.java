package com.example.continental.data.model;

public class LoginData {

    private String token;
    private String expiration;
    private SessionUser usuario;

    public String getToken() {
        return token;
    }

    public String getExpiration() {
        return expiration;
    }

    public SessionUser getUsuario() {
        return usuario;
    }
}
