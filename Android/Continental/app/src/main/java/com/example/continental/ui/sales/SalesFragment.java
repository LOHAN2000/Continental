package com.example.continental.ui.sales;

import android.content.DialogInterface;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.continental.R;
import com.example.continental.data.local.CartManager;
import com.example.continental.data.model.ApiErrorResponse;
import com.example.continental.data.model.CreateSaleRequest;
import com.example.continental.data.model.SaleDetailRequest;
import com.example.continental.data.model.SaleResponse;
import com.example.continental.data.remote.ApiService;
import com.example.continental.data.remote.RetrofitClient;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.Gson;

import java.io.IOException;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SalesFragment extends Fragment {

    private final CartManager cartManager = CartManager.getInstance();

    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(
            new Locale("es", "PE")
    );

    private CartAdapter adapter;
    private ApiService apiService;

    private TextView summaryTextView;
    private TextView totalTextView;
    private TextView emptyTextView;

    private TextInputEditText observationEditText;

    private MaterialButton confirmButton;
    private ProgressBar progressBar;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        return inflater.inflate(
                R.layout.fragment_sales,
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

        summaryTextView = view.findViewById(R.id.cartSummaryTextView);
        totalTextView = view.findViewById(R.id.saleTotalTextView);
        emptyTextView = view.findViewById(R.id.emptyCartTextView);
        observationEditText = view.findViewById(R.id.saleObservationEditText);
        confirmButton = view.findViewById(R.id.confirmSaleButton);
        progressBar = view.findViewById(R.id.saleProgressBar);

        RecyclerView recyclerView = view.findViewById(R.id.cartRecyclerView);

        adapter = new CartAdapter(cartManager, this::renderCart);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);

        confirmButton.setOnClickListener(clickedView -> confirmSale());

        renderCart();
    }

    @Override
    public void onResume() {
        super.onResume();

        if (adapter != null) {
            adapter.refresh();
            renderCart();
        }
    }

    private void renderCart() {
        boolean empty = cartManager.isEmpty();

        emptyTextView.setVisibility(empty ? View.VISIBLE : View.GONE);

        summaryTextView.setText(
                formatNumber(cartManager.getTotalUnits()) +
                        " unidad(es) · " +
                        cartManager.getItems().size() +
                        " producto(s)"
        );

        totalTextView.setText(currencyFormat.format(cartManager.getTotal()));

        confirmButton.setEnabled(!empty);
    }

    private void confirmSale() {
        if (cartManager.isEmpty()) {
            Toast.makeText(requireContext(), "Agrega productos al carrito.", Toast.LENGTH_SHORT).show();
            return;
        }

        AlertDialog dialog = new MaterialAlertDialogBuilder(
                requireContext(),
                R.style.ThemeOverlay_App_MaterialAlertDialog
        )
                .setTitle("Confirmar venta")
                .setMessage(
                        "Se registrará la venta por " +
                                currencyFormat.format(cartManager.getTotal()) + "."
                )
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Registrar", (d, which) -> createSale())
                .create();

        dialog.setOnShowListener(d -> {
            Button posBtn = dialog.getButton(DialogInterface.BUTTON_POSITIVE);
            if (posBtn != null) {
                posBtn.setTextColor(ContextCompat.getColor(requireContext(), R.color.brand_red));
                posBtn.setTypeface(null, Typeface.BOLD);
            }
            Button negBtn = dialog.getButton(DialogInterface.BUTTON_NEGATIVE);
            if (negBtn != null) {
                negBtn.setTextColor(ContextCompat.getColor(requireContext(), R.color.black));
            }
        });

        dialog.show();
    }

    private void createSale() {
        List<SaleDetailRequest> details = new ArrayList<>();

        for (CartManager.CartItem item : cartManager.getItems()) {
            details.add(
                    new SaleDetailRequest(
                            item.getProduct().getIdProducto(),
                            item.getQuantity()
                    )
            );
        }

        String observation = observationEditText.getText() == null
                ? ""
                : observationEditText.getText().toString().trim();

        CreateSaleRequest request = new CreateSaleRequest(
                observation.isEmpty() ? null : observation,
                details
        );

        setLoading(true);

        apiService.createSale(request).enqueue(new Callback<SaleResponse>() {
            @Override
            public void onResponse(
                    @NonNull Call<SaleResponse> call,
                    @NonNull Response<SaleResponse> response
            ) {
                setLoading(false);

                if (response.isSuccessful() && response.body() != null) {
                    String message = response.body().getMessage();

                    cartManager.clear();
                    adapter.refresh();

                    observationEditText.setText("");
                    renderCart();

                    showSuccess(message == null ? "Venta registrada correctamente." : message);
                    return;
                }

                Toast.makeText(requireContext(), readError(response), Toast.LENGTH_LONG).show();
            }

            @Override
            public void onFailure(
                    @NonNull Call<SaleResponse> call,
                    @NonNull Throwable throwable
            ) {
                setLoading(false);
                Toast.makeText(
                        requireContext(),
                        "No fue posible conectar con el servidor.",
                        Toast.LENGTH_LONG
                ).show();
            }
        });
    }

    private void showSuccess(String message) {
        AlertDialog dialog = new MaterialAlertDialogBuilder(
                requireContext(),
                R.style.ThemeOverlay_App_MaterialAlertDialog
        )
                .setTitle("Venta registrada")
                .setMessage(message)
                .setPositiveButton("Aceptar", null)
                .create();

        dialog.setOnShowListener(d -> {
            Button posBtn = dialog.getButton(DialogInterface.BUTTON_POSITIVE);
            if (posBtn != null) {
                posBtn.setTextColor(ContextCompat.getColor(requireContext(), R.color.brand_red));
                posBtn.setTypeface(null, Typeface.BOLD);
            }
        });

        dialog.show();
    }

    private String readError(Response<?> response) {
        if (response.errorBody() == null) {
            if (response.code() == 403) {
                return "No tienes permiso para registrar ventas.";
            }
            return "No fue posible registrar la venta.";
        }

        try {
            String json = response.errorBody().string();
            ApiErrorResponse error = new Gson().fromJson(json, ApiErrorResponse.class);

            if (error != null && error.getMessage() != null) {
                return error.getMessage();
            }
        } catch (IOException | RuntimeException ignored) {
        }

        return "No fue posible registrar la venta.";
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        confirmButton.setEnabled(!loading && !cartManager.isEmpty());
    }

    private String formatNumber(double value) {
        if (value == Math.floor(value)) {
            return String.valueOf((long) value);
        }

        return String.format(Locale.US, "%.2f", value);
    }
}
