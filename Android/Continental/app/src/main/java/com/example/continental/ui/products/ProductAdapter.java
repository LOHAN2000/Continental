package com.example.continental.ui.products;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.continental.R;
import com.example.continental.data.model.Product;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ProductAdapter extends RecyclerView.Adapter<ProductAdapter.ProductViewHolder> {

    private final List<Product> products = new ArrayList<>();

    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(
            new Locale("es", "PE")
    );

    public void submitList(List<Product> newProducts) {
        products.clear();

        if (newProducts != null) {
            products.addAll(newProducts);
        }

        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ProductViewHolder onCreateViewHolder(
            @NonNull ViewGroup parent,
            int viewType
    ) {
        View view = LayoutInflater.from(parent.getContext()).inflate(
                R.layout.item_product,
                parent,
                false
        );

        return new ProductViewHolder(view);
    }

    @Override
    public void onBindViewHolder(
            @NonNull ProductViewHolder holder,
            int position
    ) {
        holder.bind(products.get(position));
    }

    @Override
    public int getItemCount() {
        return products.size();
    }

    public class ProductViewHolder extends RecyclerView.ViewHolder {

        private final TextView nameTextView;
        private final TextView codeTextView;
        private final TextView categoryTextView;
        private final TextView priceTextView;
        private final TextView stockTextView;
        private final TextView statusTextView;
        private final TextView expirationTextView;

        ProductViewHolder(@NonNull View itemView) {
            super(itemView);

            nameTextView = itemView.findViewById(R.id.productNameTextView);
            codeTextView = itemView.findViewById(R.id.productCodeTextView);
            categoryTextView = itemView.findViewById(R.id.productCategoryTextView);
            priceTextView = itemView.findViewById(R.id.productPriceTextView);
            stockTextView = itemView.findViewById(R.id.productStockTextView);
            statusTextView = itemView.findViewById(R.id.productStatusTextView);
            expirationTextView = itemView.findViewById(R.id.productExpirationTextView);
        }

        void bind(Product product) {
            nameTextView.setText(product.getNombre());
            codeTextView.setText(product.getCodigoBarras());
            categoryTextView.setText(product.getCategoria());

            priceTextView.setText(
                    currencyFormat.format(product.getPrecioVenta())
            );

            stockTextView.setText(
                    formatNumber(product.getStockActual())
            );

            expirationTextView.setText(
                    product.isControlaVencimiento()
                            ? "Controla vencimiento"
                            : "Sin control de vencimiento"
            );

            configureStatus(product.getEstadoStock());
        }

        private void configureStatus(String status) {
            String label;
            int backgroundColor;
            int textColor;

            if ("SIN_STOCK".equals(status)) {
                label = "Sin stock";
                backgroundColor = Color.parseColor("#FFEBEE");
                textColor = Color.parseColor("#A90012");
            } else if ("STOCK_MINIMO".equals(status)) {
                label = "Stock mínimo";
                backgroundColor = Color.parseColor("#FFF7E0");
                textColor = Color.parseColor("#8A5D00");
            } else {
                label = "Disponible";
                backgroundColor = Color.parseColor("#E8F5E9");
                textColor = Color.parseColor("#147522");
            }

            GradientDrawable background = new GradientDrawable();
            background.setColor(backgroundColor);
            background.setCornerRadius(100f);

            statusTextView.setBackground(background);
            statusTextView.setTextColor(textColor);
            statusTextView.setText(label);
        }

        private String formatNumber(double value) {
            if (value == Math.floor(value)) {
                return String.valueOf((long) value);
            }

            return String.format(Locale.US, "%.2f", value);
        }
    }
}
