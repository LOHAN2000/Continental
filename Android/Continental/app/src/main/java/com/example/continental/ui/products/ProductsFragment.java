package com.example.continental.ui.products;

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
import com.example.continental.data.model.Product;
import com.example.continental.data.model.ProductsResponse;
import com.example.continental.data.remote.ApiService;
import com.example.continental.data.remote.RetrofitClient;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProductsFragment extends Fragment {

    private final List<Product> allProducts = new ArrayList<>();

    private ProductAdapter adapter;

    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private TextView messageTextView;
    private TextView resultCountTextView;
    private TextInputEditText searchEditText;

    private ApiService apiService;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        return inflater.inflate(
                R.layout.fragment_products,
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
        configureRecyclerView();
        configureSearch();

        swipeRefreshLayout.setOnRefreshListener(this::loadProducts);

        loadProducts();
    }

    private void bindViews(View view) {
        swipeRefreshLayout = view.findViewById(R.id.productsSwipeRefreshLayout);
        progressBar = view.findViewById(R.id.productsProgressBar);
        messageTextView = view.findViewById(R.id.productsMessageTextView);
        resultCountTextView = view.findViewById(R.id.productResultCountTextView);
        searchEditText = view.findViewById(R.id.productSearchEditText);
    }

    private void configureRecyclerView() {
        RecyclerView recyclerView = requireView().findViewById(R.id.productsRecyclerView);

        adapter = new ProductAdapter();

        recyclerView.setLayoutManager(
                new LinearLayoutManager(requireContext())
        );

        recyclerView.setAdapter(adapter);
    }

    private void configureSearch() {
        searchEditText.addTextChangedListener(
                new TextWatcher() {
                    @Override
                    public void beforeTextChanged(
                            CharSequence text,
                            int start,
                            int count,
                            int after
                    ) {
                    }

                    @Override
                    public void onTextChanged(
                            CharSequence text,
                            int start,
                            int before,
                            int count
                    ) {
                        filterProducts(text.toString());
                    }

                    @Override
                    public void afterTextChanged(Editable editable) {
                    }
                }
        );
    }

    private void loadProducts() {
        setLoading(true);

        apiService.getProducts(null, null, false).enqueue(
                new Callback<ProductsResponse>() {
                    @Override
                    public void onResponse(
                            @NonNull Call<ProductsResponse> call,
                            @NonNull Response<ProductsResponse> response
                    ) {
                        setLoading(false);

                        if (
                                response.isSuccessful() &&
                                        response.body() != null &&
                                        response.body().getData() != null
                        ) {
                            allProducts.clear();
                            allProducts.addAll(response.body().getData());

                            filterProducts(getSearchText());
                            return;
                        }

                        showMessage("No fue posible cargar los productos.");
                    }

                    @Override
                    public void onFailure(
                            @NonNull Call<ProductsResponse> call,
                            @NonNull Throwable throwable
                    ) {
                        setLoading(false);

                        showMessage("No fue posible conectar con el servidor.");
                    }
                }
        );
    }

    private void filterProducts(String search) {
        String normalizedSearch = search.trim().toLowerCase(Locale.ROOT);

        List<Product> filtered = new ArrayList<>();

        for (Product product : allProducts) {
            String name = product.getNombre() == null
                    ? ""
                    : product.getNombre().toLowerCase(Locale.ROOT);

            String code = product.getCodigoBarras() == null
                    ? ""
                    : product.getCodigoBarras().toLowerCase(Locale.ROOT);

            if (
                    normalizedSearch.isEmpty() ||
                            name.contains(normalizedSearch) ||
                            code.contains(normalizedSearch)
            ) {
                filtered.add(product);
            }
        }

        adapter.submitList(filtered);

        resultCountTextView.setText(
                filtered.size() + " producto(s) encontrado(s)"
        );

        messageTextView.setVisibility(
                filtered.isEmpty() ? View.VISIBLE : View.GONE
        );

        if (filtered.isEmpty()) {
            messageTextView.setText("No se encontraron productos.");
        }
    }

    private String getSearchText() {
        return searchEditText.getText() == null
                ? ""
                : searchEditText.getText().toString();
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(
                loading && !swipeRefreshLayout.isRefreshing()
                        ? View.VISIBLE
                        : View.GONE
        );

        swipeRefreshLayout.setRefreshing(false);
    }

    private void showMessage(String message) {
        adapter.submitList(new ArrayList<>());

        resultCountTextView.setText("0 productos encontrados");

        messageTextView.setText(message);
        messageTextView.setVisibility(View.VISIBLE);
    }
}
