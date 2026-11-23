package com.example.continental.ui.sales;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.continental.R;
import com.example.continental.data.local.CartManager;
import com.google.android.material.button.MaterialButton;

import java.text.NumberFormat;
import java.util.Locale;

public class CartAdapter extends RecyclerView.Adapter<CartAdapter.CartViewHolder> {

    public interface CartChangeListener {
        void onCartChanged();
    }

    private final CartManager cartManager;
    private final CartChangeListener listener;

    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(
            new Locale("es", "PE")
    );

    public CartAdapter(CartManager cartManager, CartChangeListener listener) {
        this.cartManager = cartManager;
        this.listener = listener;
    }

    public void refresh() {
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public CartViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(
                R.layout.item_cart,
                parent,
                false
        );

        return new CartViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull CartViewHolder holder, int position) {
        holder.bind(cartManager.getItems().get(position));
    }

    @Override
    public int getItemCount() {
        return cartManager.getItems().size();
    }

    class CartViewHolder extends RecyclerView.ViewHolder {

        private final TextView nameTextView;
        private final TextView priceTextView;
        private final TextView quantityTextView;
        private final TextView subtotalTextView;

        private final MaterialButton decreaseButton;
        private final MaterialButton increaseButton;

        private final ImageButton removeButton;

        CartViewHolder(@NonNull View itemView) {
            super(itemView);

            nameTextView = itemView.findViewById(R.id.cartProductNameTextView);
            priceTextView = itemView.findViewById(R.id.cartProductPriceTextView);
            quantityTextView = itemView.findViewById(R.id.cartQuantityTextView);
            subtotalTextView = itemView.findViewById(R.id.cartSubtotalTextView);

            decreaseButton = itemView.findViewById(R.id.decreaseCartQuantityButton);
            increaseButton = itemView.findViewById(R.id.increaseCartQuantityButton);

            removeButton = itemView.findViewById(R.id.removeCartItemButton);
        }

        void bind(CartManager.CartItem item) {
            nameTextView.setText(item.getProduct().getNombre());

            priceTextView.setText(
                    currencyFormat.format(item.getProduct().getPrecioVenta()) + " por unidad"
            );

            quantityTextView.setText(formatNumber(item.getQuantity()));

            subtotalTextView.setText(currencyFormat.format(item.getSubtotal()));

            decreaseButton.setOnClickListener(view -> updateQuantity(item, item.getQuantity() - 1));

            increaseButton.setOnClickListener(view -> updateQuantity(item, item.getQuantity() + 1));

            removeButton.setOnClickListener(view -> {
                cartManager.removeProduct(item.getProduct().getIdProducto());
                refresh();
                listener.onCartChanged();
            });
        }

        private void updateQuantity(CartManager.CartItem item, double quantity) {
            String error = cartManager.updateQuantity(
                    item.getProduct().getIdProducto(),
                    quantity
            );

            if (error != null) {
                Toast.makeText(itemView.getContext(), error, Toast.LENGTH_LONG).show();
                return;
            }

            refresh();
            listener.onCartChanged();
        }

        private String formatNumber(double value) {
            if (value == Math.floor(value)) {
                return String.valueOf((long) value);
            }

            return String.format(Locale.US, "%.2f", value);
        }
    }
}
