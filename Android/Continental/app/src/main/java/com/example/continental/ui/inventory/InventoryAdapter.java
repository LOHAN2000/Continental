package com.example.continental.ui.inventory;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.continental.R;
import com.example.continental.data.model.InventoryItem;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class InventoryAdapter extends RecyclerView.Adapter<InventoryAdapter.InventoryViewHolder> {

    public interface OnKardexClickListener {
        void onKardexClick(InventoryItem item);
    }

    private final List<InventoryItem> items = new ArrayList<>();
    private final OnKardexClickListener listener;

    public InventoryAdapter(OnKardexClickListener listener) {
        this.listener = listener;
    }

    public void submitList(List<InventoryItem> newItems) {
        items.clear();

        if (newItems != null) {
            items.addAll(newItems);
        }

        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public InventoryViewHolder onCreateViewHolder(
            @NonNull ViewGroup parent,
            int viewType
    ) {
        View view = LayoutInflater.from(parent.getContext()).inflate(
                R.layout.item_inventory,
                parent,
                false
        );

        return new InventoryViewHolder(view);
    }

    @Override
    public void onBindViewHolder(
            @NonNull InventoryViewHolder holder,
            int position
    ) {
        holder.bind(items.get(position));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    public class InventoryViewHolder extends RecyclerView.ViewHolder {

        private final TextView nameTextView;
        private final TextView codeTextView;
        private final TextView categoryTextView;
        private final TextView currentStockTextView;
        private final TextView minimumStockTextView;
        private final TextView batchStockTextView;
        private final TextView expirationTextView;
        private final TextView statusTextView;
        private final MaterialButton kardexButton;

        public InventoryViewHolder(@NonNull View itemView) {
            super(itemView);

            nameTextView = itemView.findViewById(R.id.inventoryProductNameTextView);
            codeTextView = itemView.findViewById(R.id.inventoryProductCodeTextView);
            categoryTextView = itemView.findViewById(R.id.inventoryCategoryTextView);
            currentStockTextView = itemView.findViewById(R.id.inventoryCurrentStockTextView);
            minimumStockTextView = itemView.findViewById(R.id.inventoryMinimumStockTextView);
            batchStockTextView = itemView.findViewById(R.id.inventoryBatchStockTextView);
            expirationTextView = itemView.findViewById(R.id.inventoryExpirationTextView);
            statusTextView = itemView.findViewById(R.id.inventoryStatusTextView);
            kardexButton = itemView.findViewById(R.id.viewKardexButton);
        }

        void bind(InventoryItem item) {
            nameTextView.setText(item.getProducto());
            codeTextView.setText(item.getCodigoBarras());
            categoryTextView.setText(item.getCategoria());

            currentStockTextView.setText(
                    formatNumber(item.getStockActual())
            );

            minimumStockTextView.setText(
                    formatNumber(item.getStockMinimo())
            );

            batchStockTextView.setText(
                    item.isControlaVencimiento()
                            ? formatNumber(item.getCantidadEnLotes())
                            : "No aplica"
            );

            String expiration = item.getProximoVencimiento();

            expirationTextView.setText(
                    expiration == null || expiration.trim().isEmpty()
                            ? "Sin próximo vencimiento"
                            : "Próximo vencimiento: " + formatDate(expiration)
            );

            configureStatus(item.getEstadoStock());

            kardexButton.setOnClickListener(view -> listener.onKardexClick(item));
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

        private String formatDate(String value) {
            String[] parts = value.split("-");

            if (parts.length != 3) {
                return value;
            }

            return parts[2] + "/" + parts[1] + "/" + parts[0];
        }

        private String formatNumber(double value) {
            if (value == Math.floor(value)) {
                return String.valueOf((long) value);
            }

            return String.format(Locale.US, "%.2f", value);
        }
    }
}
