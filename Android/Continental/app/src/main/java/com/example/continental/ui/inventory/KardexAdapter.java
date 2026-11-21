package com.example.continental.ui.inventory;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.continental.R;
import com.example.continental.data.model.InventoryMovement;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class KardexAdapter extends RecyclerView.Adapter<KardexAdapter.MovementViewHolder> {

    private final List<InventoryMovement> movements = new ArrayList<>();

    public void submitList(List<InventoryMovement> newMovements) {
        movements.clear();

        if (newMovements != null) {
            movements.addAll(newMovements);
        }

        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public MovementViewHolder onCreateViewHolder(
            @NonNull ViewGroup parent,
            int viewType
    ) {
        View view = LayoutInflater.from(parent.getContext()).inflate(
                R.layout.item_kardex_movement,
                parent,
                false
        );

        return new MovementViewHolder(view);
    }

    @Override
    public void onBindViewHolder(
            @NonNull MovementViewHolder holder,
            int position
    ) {
        holder.bind(movements.get(position));
    }

    @Override
    public int getItemCount() {
        return movements.size();
    }

    public static class MovementViewHolder extends RecyclerView.ViewHolder {

        private final TextView typeTextView;
        private final TextView dateTextView;
        private final TextView quantityTextView;
        private final TextView balanceTextView;
        private final TextView reasonTextView;

        public MovementViewHolder(@NonNull View itemView) {
            super(itemView);

            typeTextView = itemView.findViewById(R.id.movementTypeTextView);
            dateTextView = itemView.findViewById(R.id.movementDateTextView);
            quantityTextView = itemView.findViewById(R.id.movementQuantityTextView);
            balanceTextView = itemView.findViewById(R.id.movementBalanceTextView);
            reasonTextView = itemView.findViewById(R.id.movementReasonTextView);
        }

        void bind(InventoryMovement movement) {
            typeTextView.setText(getTypeLabel(movement.getTipo()));
            dateTextView.setText(formatDate(movement.getFecha()));

            boolean isEntry = movement.getEntrada() > 0;
            double quantity = isEntry ? movement.getEntrada() : movement.getSalida();

            quantityTextView.setText((isEntry ? "+" : "-") + formatNumber(quantity));
            quantityTextView.setTextColor(
                    Color.parseColor(isEntry ? "#147522" : "#A90012")
            );

            balanceTextView.setText(
                    "Saldo: " + formatNumber(movement.getSaldo()) +
                            " · " + safeText(movement.getUsuario(), "Usuario no disponible")
            );

            reasonTextView.setText(
                    safeText(movement.getMotivo(), "Sin motivo registrado")
            );
        }

        private static String getTypeLabel(String type) {
            if ("COMPRA".equals(type)) {
                return "Compra";
            }

            if ("VENTA".equals(type)) {
                return "Venta";
            }

            if ("AJUSTE_ENTRADA".equals(type)) {
                return "Ajuste de entrada";
            }

            if ("AJUSTE_SALIDA".equals(type)) {
                return "Ajuste de salida";
            }

            return type == null ? "Movimiento" : type;
        }

        private static String formatDate(String value) {
            if (value == null || value.trim().isEmpty()) {
                return "";
            }

            String normalizedValue = value.replace("Z", "+00:00");

            SimpleDateFormat input = new SimpleDateFormat(
                    "yyyy-MM-dd'T'HH:mm:ss.SSSSSSSXXX",
                    Locale.US
            );

            SimpleDateFormat output = new SimpleDateFormat(
                    "dd/MM/yyyy HH:mm",
                    new Locale("es", "PE")
            );

            output.setTimeZone(TimeZone.getTimeZone("America/Lima"));

            try {
                Date date = input.parse(normalizedValue);
                return date == null ? value : output.format(date);
            } catch (ParseException ignored) {
                return value.replace("T", " ").replace("Z", "");
            }
        }

        private static String formatNumber(double value) {
            if (value == Math.floor(value)) {
                return String.valueOf((long) value);
            }

            return String.format(Locale.US, "%.2f", value);
        }

        private static String safeText(String value, String fallback) {
            return value == null || value.trim().isEmpty() ? fallback : value;
        }
    }
}
