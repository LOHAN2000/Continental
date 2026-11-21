package com.example.continental;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.example.continental.data.local.SessionManager;
import com.example.continental.ui.alerts.AlertsFragment;
import com.example.continental.ui.inventory.InventoryFragment;
import com.example.continental.ui.login.LoginActivity;
import com.example.continental.ui.products.ProductsFragment;
import com.example.continental.ui.sales.SalesFragment;
import com.example.continental.ui.scanner.ScannerFragment;
import com.google.android.material.bottomnavigation.BottomNavigationView;

public class MainActivity extends AppCompatActivity {

    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        androidx.appcompat.app.AppCompatDelegate.setDefaultNightMode(
                androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO
        );
        super.onCreate(savedInstanceState);

        sessionManager = new SessionManager(this);

        if (!sessionManager.hasSession()) {
            openLogin();
            return;
        }

        setContentView(R.layout.activity_main);

        configureHeader();
        configureNavigation();

        if (savedInstanceState == null) {
            showFragment(new ProductsFragment());
        }
    }

    private void configureHeader() {
        TextView userNameTextView = findViewById(R.id.headerUserNameTextView);
        TextView roleTextView = findViewById(R.id.headerRoleTextView);
        ImageButton logoutButton = findViewById(R.id.logoutButton);

        userNameTextView.setText(sessionManager.getUserName());
        roleTextView.setText(sessionManager.getUserRole());

        logoutButton.setOnClickListener(view -> {
            sessionManager.clearSession();
            openLogin();
        });
    }

    private void configureNavigation() {
        BottomNavigationView navigationView = findViewById(R.id.bottomNavigationView);

        navigationView.setSelectedItemId(R.id.navigation_products);

        navigationView.setOnItemSelectedListener(item -> {
            Fragment fragment;

            int itemId = item.getItemId();

            if (itemId == R.id.navigation_products) {
                fragment = new ProductsFragment();
            } else if (itemId == R.id.navigation_inventory) {
                fragment = new InventoryFragment();
            } else if (itemId == R.id.navigation_scanner) {
                fragment = new ScannerFragment();
            } else if (itemId == R.id.navigation_sales) {
                fragment = new SalesFragment();
            } else if (itemId == R.id.navigation_alerts) {
                fragment = new AlertsFragment();
            } else {
                return false;
            }

            showFragment(fragment);
            return true;
        });
    }

    private void showFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.mainFragmentContainer, fragment)
                .commit();
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
