package com.example.continental.ui.alerts;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.continental.R;
import com.example.continental.data.model.InventoryAlert;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class AlertAdapter extends RecyclerView.Adapter<AlertAdapter.AlertViewHolder> {

    public interface OnReadClickListener {
        void onReadClick(InventoryAlert alert);
    }

    private final List<InventoryAlert> alerts = new ArrayList<>();
    private final OnReadClickListener listener;

    public AlertAdapter(OnReadClickListener listener) {
        this.listener = listener;
    }

    public void submitList(List<InventoryAlert> newAlerts) {
        alerts.clear();

        if (newAlerts != null) {
            alerts.addAll(newAlerts);
        }

        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public AlertViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(
                R.layout.item_alert,
                parent,
                false
        );

        return new AlertViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull AlertViewHolder holder, int position) {
        holder.bind(alerts.get(position));
    }

    @Override
    public int getItemCount() {
        return alerts.size();
    }

    class AlertViewHolder extends RecyclerView.ViewHolder {

        private final MaterialCardView cardView;
        private final LinearLayout contentLayout;

        private final TextView typeTextView;
        private final TextView readTextView;
        private final TextView productTextView;
        private final TextView messageTextView;
        private final TextView dataTextView;

        private final MaterialButton readButton;

        AlertViewHolder(@NonNull View itemView) {
            super(itemView);

            cardView = (MaterialCardView) itemView;
            contentLayout = itemView.findViewById(R.id.alertContentLayout);
            typeTextView = itemView.findViewById(R.id.alertTypeTextView);
            readTextView = itemView.findViewById(R.id.alertReadStatusTextView);
            productTextView = itemView.findViewById(R.id.alertProductTextView);
            messageTextView = itemView.findViewById(R.id.alertMessageTextView);
            dataTextView = itemView.findViewById(R.id.alertDataTextView);
            readButton = itemView.findViewById(R.id.markAlertReadButton);
        }

        void bind(InventoryAlert alert) {
            boolean stockAlert = "STOCK_MINIMO".equals(alert.getTipo());

            typeTextView.setText(stockAlert ? "Stock mínimo" : "Próximo vencimiento");
            typeTextView.setTextColor(
                    Color.parseColor(stockAlert ? "#A90012" : "#8A5D00")
            );

            productTextView.setText(alert.getProducto());
            messageTextView.setText(alert.getMensaje());
            readTextView.setText(alert.isLeida() ? "Leída" : "Pendiente");

            if (stockAlert) {
                dataTextView.setText(
                        "Stock actual: " +
                                formatNumber(alert.getStockActual()) +
                                " · Mínimo: " +
                                formatNumber(alert.getStockMinimo())
                );
            } else {
                dataTextView.setText(
                        "Lote: " +
                                safeText(alert.getCodigoLote(), "No disponible") +
                                " · Vence: " +
                                formatDate(alert.getFechaVencimiento())
                );
            }

            cardView.setStrokeColor(
                    Color.parseColor(
                            alert.isLeida()
                                    ? "#CBD5E1"
                                    : stockAlert
                                    ? "#FFCDD2"
                                    : "#FFE0A3"
                    )
            );

            contentLayout.setBackgroundColor(
                    Color.parseColor(
                            alert.isLeida()
                                    ? "#FFFFFF"
                                    : stockAlert
                                    ? "#FFF8F8"
                                    : "#FFFCF2"
                    )
            );

            readButton.setVisibility(alert.isLeida() ? View.GONE : View.VISIBLE);

            readButton.setOnClickListener(view -> listener.onReadClick(alert));
        }

        private String formatDate(String value) {
            if (value == null || value.trim().isEmpty()) {
                return "No disponible";
            }

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

        private String safeText(String value, String fallback) {
            return value == null || value.trim().isEmpty() ? fallback : value;
        }
    }
}
