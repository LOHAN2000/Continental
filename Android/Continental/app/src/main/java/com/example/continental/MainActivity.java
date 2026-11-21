package com.example.continental;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.example.continental.data.local.SessionManager;
import com.example.continental.ui.login.LoginActivity;
import com.google.android.material.button.MaterialButton;

public class MainActivity extends AppCompatActivity {

    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        sessionManager = new SessionManager(this);

        if (!sessionManager.hasSession()) {
            openLogin();
            return;
        }

        setContentView(R.layout.activity_main);

        TextView welcomeTextView = findViewById(R.id.welcomeTextView);
        TextView roleTextView = findViewById(R.id.roleTextView);
        MaterialButton logoutButton = findViewById(R.id.logoutButton);

        welcomeTextView.setText("Bienvenido, " + sessionManager.getUserName());
        roleTextView.setText(sessionManager.getUserRole());

        logoutButton.setOnClickListener(view -> {
            sessionManager.clearSession();
            openLogin();
        });
    }

    private void openLogin() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TASK
        );
        startActivity(intent);
        finish();
    }
}
