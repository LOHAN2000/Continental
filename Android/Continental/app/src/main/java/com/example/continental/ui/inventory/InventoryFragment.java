package com.example.continental.ui.inventory;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.example.continental.R;
import com.example.continental.data.model.InventoryItem;
import com.example.continental.data.model.InventoryMovement;
import com.example.continental.data.model.InventoryResponse;
import com.example.continental.data.model.InventorySummary;
import com.example.continental.data.model.InventorySummaryResponse;
import com.example.continental.data.model.KardexResponse;
import com.example.continental.data.remote.ApiService;
import com.example.continental.data.remote.RetrofitClient;
import com.google.android.material.button.MaterialButtonToggleGroup;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class InventoryFragment extends Fragment implements InventoryAdapter.OnKardexClickListener {

    private final List<InventoryItem> allItems = new ArrayList<>();

    private InventoryAdapter adapter;

    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private TextView messageTextView;
    private TextView countTextView;
    private TextInputEditText searchEditText;
    private MaterialButtonToggleGroup statusToggleGroup;

    private ApiService apiService;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        return inflater.inflate(
                R.layout.fragment_inventory,
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

        bindViews(view);
        setupSummaryLabels(view);
        configureRecyclerView(view);
        configureSearch();
        configureFilterToggle();

        swipeRefreshLayout.setOnRefreshListener(this::loadData);

        loadData();
    }

    private void bindViews(View view) {
        swipeRefreshLayout = view.findViewById(R.id.inventorySwipeRefreshLayout);
        progressBar = view.findViewById(R.id.inventoryProgressBar);
        messageTextView = view.findViewById(R.id.inventoryMessageTextView);
        countTextView = view.findViewById(R.id.inventoryResultCountTextView);
        searchEditText = view.findViewById(R.id.inventorySearchEditText);
        statusToggleGroup = view.findViewById(R.id.inventoryStatusToggleGroup);
    }

    private void setupSummaryLabels(View view) {
        View availableCard = view.findViewById(R.id.availableSummaryCard);
        if (availableCard != null) {
            TextView label = availableCard.findViewById(R.id.summaryLabelTextView);
            label.setText("Disponibles");
            TextView val = availableCard.findViewById(R.id.summaryValueTextView);
            val.setText("-");
        }

        View minimumCard = view.findViewById(R.id.minimumSummaryCard);
        if (minimumCard != null) {
            TextView label = minimumCard.findViewById(R.id.summaryLabelTextView);
            label.setText("Stock mínimo");
            TextView val = minimumCard.findViewById(R.id.summaryValueTextView);
            val.setText("-");
        }

        View outOfStockCard = view.findViewById(R.id.outOfStockSummaryCard);
        if (outOfStockCard != null) {
            TextView label = outOfStockCard.findViewById(R.id.summaryLabelTextView);
            label.setText("Sin stock");
            TextView val = outOfStockCard.findViewById(R.id.summaryValueTextView);
            val.setText("-");
        }

        View unitsCard = view.findViewById(R.id.unitsSummaryCard);
        if (unitsCard != null) {
            TextView label = unitsCard.findViewById(R.id.summaryLabelTextView);
            label.setText("Unidades");
            TextView val = unitsCard.findViewById(R.id.summaryValueTextView);
            val.setText("-");
        }
    }

    private void configureRecyclerView(View view) {
        RecyclerView recyclerView = view.findViewById(R.id.inventoryRecyclerView);
        adapter = new InventoryAdapter(this);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);
    }

    private void configureSearch() {
        searchEditText.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterInventory();
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });
    }

    private void configureFilterToggle() {
        statusToggleGroup.addOnButtonCheckedListener((group, checkedId, isChecked) -> {
            if (isChecked) {
                filterInventory();
            }
        });
    }

    private void loadData() {
        loadSummary();
        loadInventory();
    }

    private void loadSummary() {
        apiService.getInventorySummary().enqueue(new Callback<InventorySummaryResponse>() {
            @Override
            public void onResponse(
                    @NonNull Call<InventorySummaryResponse> call,
                    @NonNull Response<InventorySummaryResponse> response
            ) {
                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    updateSummary(response.body().getData());
                }
            }

            @Override
            public void onFailure(
                    @NonNull Call<InventorySummaryResponse> call,
                    @NonNull Throwable t
            ) {
            }
        });
    }

    private void updateSummary(InventorySummary summary) {
        View root = getView();
        if (root == null) return;

        View availableCard = root.findViewById(R.id.availableSummaryCard);
        if (availableCard != null) {
            TextView val = availableCard.findViewById(R.id.summaryValueTextView);
            val.setText(String.valueOf(summary.getProductosDisponibles()));
        }

        View minimumCard = root.findViewById(R.id.minimumSummaryCard);
        if (minimumCard != null) {
            TextView val = minimumCard.findViewById(R.id.summaryValueTextView);
            val.setText(String.valueOf(summary.getProductosConStockMinimo()));
        }

        View outOfStockCard = root.findViewById(R.id.outOfStockSummaryCard);
        if (outOfStockCard != null) {
            TextView val = outOfStockCard.findViewById(R.id.summaryValueTextView);
            val.setText(String.valueOf(summary.getProductosSinStock()));
        }

        View unitsCard = root.findViewById(R.id.unitsSummaryCard);
        if (unitsCard != null) {
            TextView val = unitsCard.findViewById(R.id.summaryValueTextView);
            val.setText(formatNumber(summary.getUnidadesDisponibles()));
        }
    }

    private void loadInventory() {
        setLoading(true);

        apiService.getInventory(null, null, null, false).enqueue(new Callback<InventoryResponse>() {
            @Override
            public void onResponse(
                    @NonNull Call<InventoryResponse> call,
                    @NonNull Response<InventoryResponse> response
            ) {
                setLoading(false);

                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    allItems.clear();
                    allItems.addAll(response.body().getData());
                    filterInventory();
                    return;
                }

                showMessage("No fue posible cargar el inventario.");
            }

            @Override
            public void onFailure(
                    @NonNull Call<InventoryResponse> call,
                    @NonNull Throwable throwable
            ) {
                setLoading(false);
                showMessage("No fue posible conectar con el servidor.");
            }
        });
    }

    private void filterInventory() {
        String search = searchEditText.getText() == null
                ? ""
                : searchEditText.getText().toString().trim().toLowerCase(Locale.ROOT);

        int checkedId = statusToggleGroup.getCheckedButtonId();

        List<InventoryItem> filtered = new ArrayList<>();

        for (InventoryItem item : allItems) {
            String status = item.getEstadoStock();

            boolean matchesStatus = true;
            if (checkedId == R.id.availableInventoryButton) {
                matchesStatus = "DISPONIBLE".equals(status) ||
                        (!"SIN_STOCK".equals(status) && !"STOCK_MINIMO".equals(status));
            } else if (checkedId == R.id.criticalInventoryButton) {
                matchesStatus = "STOCK_MINIMO".equals(status) || "SIN_STOCK".equals(status);
            }

            if (!matchesStatus) {
                continue;
            }

            String product = item.getProducto() == null ? "" : item.getProducto().toLowerCase(Locale.ROOT);
            String code = item.getCodigoBarras() == null ? "" : item.getCodigoBarras().toLowerCase(Locale.ROOT);

            if (search.isEmpty() || product.contains(search) || code.contains(search)) {
                filtered.add(item);
            }
        }

        adapter.submitList(filtered);

        countTextView.setText(filtered.size() + " producto(s) encontrado(s)");

        messageTextView.setVisibility(filtered.isEmpty() ? View.VISIBLE : View.GONE);
        if (filtered.isEmpty()) {
            messageTextView.setText("No se encontraron productos en el inventario.");
        }
    }

    @Override
    public void onKardexClick(InventoryItem item) {
        showKardexDialog(item);
    }

    private void showKardexDialog(InventoryItem item) {
        View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_kardex, null);

        TextView kardexProductTextView = dialogView.findViewById(R.id.kardexProductTextView);
        TextView kardexSummaryTextView = dialogView.findViewById(R.id.kardexSummaryTextView);
        RecyclerView kardexRecyclerView = dialogView.findViewById(R.id.kardexRecyclerView);
        ProgressBar kardexProgressBar = dialogView.findViewById(R.id.kardexProgressBar);
        TextView kardexMessageTextView = dialogView.findViewById(R.id.kardexMessageTextView);

        kardexProductTextView.setText(item.getProducto());
        kardexSummaryTextView.setText(
                "Código: " + item.getCodigoBarras() + " · Stock actual: " + formatNumber(item.getStockActual())
        );

        KardexAdapter kardexAdapter = new KardexAdapter();
        kardexRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        kardexRecyclerView.setAdapter(kardexAdapter);

        androidx.appcompat.app.AlertDialog dialog = new MaterialAlertDialogBuilder(requireContext(), R.style.ThemeOverlay_App_MaterialAlertDialog)
                .setView(dialogView)
                .setPositiveButton("Cerrar", null)
                .create();

        dialog.setOnShowListener(d -> {
            android.widget.Button closeButton = dialog.getButton(androidx.appcompat.app.AlertDialog.BUTTON_POSITIVE);
            if (closeButton != null) {
                closeButton.setTextColor(androidx.core.content.ContextCompat.getColor(requireContext(), R.color.brand_red));
                closeButton.setTypeface(null, android.graphics.Typeface.BOLD);
            }
        });

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        dialog.show();

        kardexProgressBar.setVisibility(View.VISIBLE);
        kardexMessageTextView.setVisibility(View.GONE);

        apiService.getProductKardex(item.getIdProducto(), null, null).enqueue(new Callback<KardexResponse>() {
            @Override
            public void onResponse(
                    @NonNull Call<KardexResponse> call,
                    @NonNull Response<KardexResponse> response
            ) {
                kardexProgressBar.setVisibility(View.GONE);

                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    List<InventoryMovement> movements = response.body().getData().getMovimientos();
                    if (movements == null || movements.isEmpty()) {
                        kardexMessageTextView.setText("No hay movimientos registrados para este producto.");
                        kardexMessageTextView.setVisibility(View.VISIBLE);
                    } else {
                        kardexAdapter.submitList(movements);
                    }
                    return;
                }

                kardexMessageTextView.setText("No fue posible cargar el Kardex.");
                kardexMessageTextView.setVisibility(View.VISIBLE);
            }

            @Override
            public void onFailure(
                    @NonNull Call<KardexResponse> call,
                    @NonNull Throwable throwable
            ) {
                kardexProgressBar.setVisibility(View.GONE);
                kardexMessageTextView.setText("No fue posible conectar con el servidor.");
                kardexMessageTextView.setVisibility(View.VISIBLE);
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
        countTextView.setText("0 productos encontrados");
        messageTextView.setText(message);
        messageTextView.setVisibility(View.VISIBLE);
    }

    private String formatNumber(double value) {
        if (value == Math.floor(value)) {
            return String.valueOf((long) value);
        }

        return String.format(Locale.US, "%.2f", value);
    }
}
