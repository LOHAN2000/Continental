package com.example.continental.ui.shared;

import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class PlaceholderFragment extends Fragment {

    private final String title;
    private final String description;

    public PlaceholderFragment(
            String title,
            String description
    ) {
        this.title = title;
        this.description = description;
    }

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        LinearLayout layout = new LinearLayout(requireContext());

        layout.setLayoutParams(
                new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                )
        );

        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);

        int padding = (int) (24 * getResources().getDisplayMetrics().density);

        layout.setPadding(padding, padding, padding, padding);

        TextView titleTextView = new TextView(requireContext());
        titleTextView.setText(title);
        titleTextView.setTextSize(26);
        titleTextView.setTextColor(
                android.graphics.Color.parseColor("#24272A")
        );
        titleTextView.setGravity(Gravity.CENTER);

        TextView descriptionTextView = new TextView(requireContext());
        descriptionTextView.setText(description);
        descriptionTextView.setTextSize(15);
        descriptionTextView.setTextColor(
                android.graphics.Color.parseColor("#667085")
        );
        descriptionTextView.setGravity(Gravity.CENTER);
        descriptionTextView.setPadding(0, padding / 2, 0, 0);

        layout.addView(titleTextView);
        layout.addView(descriptionTextView);

        return layout;
    }
}
