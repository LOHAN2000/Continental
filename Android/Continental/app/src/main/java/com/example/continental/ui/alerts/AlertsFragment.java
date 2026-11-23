package com.example.continental.ui.alerts;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.example.continental.R;
import com.example.continental.data.model.AlertActionResponse;
import com.example.continental.data.model.AlertsResponse;
import com.example.continental.data.model.InventoryAlert;
import com.example.continental.data.remote.ApiService;
import com.example.continental.data.remote.RetrofitClient;
import com.google.android.material.button.MaterialButtonToggleGroup;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AlertsFragment extends Fragment {

    private static final String FILTER_ALL = "TODAS";
    private static final String FILTER_UNREAD = "NO_LEIDAS";
    private static final String FILTER_READ = "LEIDAS";

    private final List<InventoryAlert> allAlerts = new ArrayList<>();

    private AlertAdapter adapter;
    private ApiService apiService;

    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private TextView summaryTextView;
    private TextView messageTextView;
    private TextInputEditText searchEditText;

    private String currentFilter = FILTER_ALL;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        return inflater.inflate(
                R.layout.fragment_alerts,
                container,
                false
        );
    }

    @Override
    public void onViewCreated(
            @NonNull View view,
            @Nullable Bundle savedInstanceState
    ) {
        super.onViewCreated(view, savedInstanceState);

        apiService = RetrofitClient.getApiService(requireContext());

        swipeRefreshLayout = view.findViewById(R.id.alertsSwipeRefreshLayout);
        progressBar = view.findViewById(R.id.alertsProgressBar);
        summaryTextView = view.findViewById(R.id.alertsSummaryTextView);
        messageTextView = view.findViewById(R.id.alertsMessageTextView);
        searchEditText = view.findViewById(R.id.alertSearchEditText);

        RecyclerView recyclerView = view.findViewById(R.id.alertsRecyclerView);

        adapter = new AlertAdapter(this::markAsRead);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);

        configureSearch();
        configureFilters(view);

        swipeRefreshLayout.setOnRefreshListener(this::loadAlerts);

        loadAlerts();
    }

    private void configureSearch() {
        searchEditText.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence text, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence text, int start, int before, int count) {
                applyFilters();
            }

            @Override
            public void afterTextChanged(Editable editable) {
            }
        });
    }

    private void configureFilters(View view) {
        MaterialButtonToggleGroup group = view.findViewById(R.id.alertFilterToggleGroup);
        group.check(R.id.allAlertsButton);

        group.addOnButtonCheckedListener((toggleGroup, checkedId, checked) -> {
            if (!checked) {
                return;
            }

            if (checkedId == R.id.unreadAlertsButton) {
                currentFilter = FILTER_UNREAD;
            } else if (checkedId == R.id.readAlertsButton) {
                currentFilter = FILTER_READ;
            } else {
                currentFilter = FILTER_ALL;
            }

            applyFilters();
        });
    }

    private void loadAlerts() {
        setLoading(true);

        apiService.getAlerts(null, null, false).enqueue(new Callback<AlertsResponse>() {
            @Override
            public void onResponse(
                    @NonNull Call<AlertsResponse> call,
                    @NonNull Response<AlertsResponse> response
            ) {
                setLoading(false);

                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    allAlerts.clear();
                    allAlerts.addAll(response.body().getData());
                    applyFilters();
                    return;
                }

                showMessage("No fue posible cargar las alertas.");
            }

            @Override
            public void onFailure(
                    @NonNull Call<AlertsResponse> call,
                    @NonNull Throwable throwable
            ) {
                setLoading(false);
                showMessage("No fue posible conectar con el servidor.");
            }
        });
    }

    private void applyFilters() {
        String search = searchEditText.getText() == null
                ? ""
                : searchEditText.getText().toString().trim().toLowerCase(Locale.ROOT);

        List<InventoryAlert> filtered = new ArrayList<>();

        int unreadCount = 0;

        for (InventoryAlert alert : allAlerts) {
            if (!alert.isLeida()) {
                unreadCount++;
            }

            String product = safeLower(alert.getProducto());
            String code = safeLower(alert.getCodigoBarras());
            String batch = safeLower(alert.getCodigoLote());
            String message = safeLower(alert.getMensaje());

            boolean matchesSearch = search.isEmpty() ||
                    product.contains(search) ||
                    code.contains(search) ||
                    batch.contains(search) ||
                    message.contains(search);

            boolean matchesRead;

            if (FILTER_UNREAD.equals(currentFilter)) {
                matchesRead = !alert.isLeida();
            } else if (FILTER_READ.equals(currentFilter)) {
                matchesRead = alert.isLeida();
            } else {
                matchesRead = true;
            }

            if (matchesSearch && matchesRead) {
                filtered.add(alert);
            }
        }

        adapter.submitList(filtered);

        summaryTextView.setText(
                allAlerts.size() + " activa(s) · " + unreadCount + " pendiente(s)"
        );

        messageTextView.setVisibility(filtered.isEmpty() ? View.VISIBLE : View.GONE);

        if (filtered.isEmpty()) {
            messageTextView.setText("No se encontraron alertas.");
        }
    }

    private void markAsRead(InventoryAlert alert) {
        apiService.markAlertAsRead(alert.getIdAlerta()).enqueue(new Callback<AlertActionResponse>() {
            @Override
            public void onResponse(
                    @NonNull Call<AlertActionResponse> call,
                    @NonNull Response<AlertActionResponse> response
            ) {
                if (response.isSuccessful()) {
                    Toast.makeText(requireContext(), "Alerta marcada como leída.", Toast.LENGTH_SHORT).show();
                    loadAlerts();
                    return;
                }

                Toast.makeText(requireContext(), "No fue posible actualizar la alerta.", Toast.LENGTH_LONG).show();
            }

            @Override
            public void onFailure(
                    @NonNull Call<AlertActionResponse> call,
                    @NonNull Throwable throwable
            ) {
                Toast.makeText(requireContext(), "No fue posible conectar con el servidor.", Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(
                loading && !swipeRefreshLayout.isRefreshing()
                        ? View.VISIBLE
                        : View.GONE
        );

        if (!loading) {
            swipeRefreshLayout.setRefreshing(false);
        }
    }

    private void showMessage(String message) {
        adapter.submitList(new ArrayList<>());
        messageTextView.setText(message);
        messageTextView.setVisibility(View.VISIBLE);
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }
}
