package com.example.continental.ui.scanner;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.Image;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.example.continental.R;
import com.example.continental.data.model.Product;
import com.example.continental.data.model.ProductResponse;
import com.example.continental.data.remote.ApiService;
import com.example.continental.data.remote.RetrofitClient;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;

import java.text.NumberFormat;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ScannerFragment extends Fragment {

    private PreviewView previewView;
    private ProgressBar progressBar;
    private TextView statusTextView;
    private MaterialButton scanAgainButton;

    private ProcessCameraProvider cameraProvider;
    private ExecutorService cameraExecutor;
    private BarcodeScanner barcodeScanner;

    private final AtomicBoolean codeDetected = new AtomicBoolean(false);
    private ApiService apiService;
    private ActivityResultLauncher<String> cameraPermissionLauncher;

    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(
            new Locale("es", "PE")
    );

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        cameraPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                isGranted -> {
                    if (isGranted) {
                        startCamera();
                    } else {
                        showPermissionDenied();
                    }
                }
        );
    }

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        return inflater.inflate(
                R.layout.fragment_scanner,
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
        cameraExecutor = Executors.newSingleThreadExecutor();

        BarcodeScannerOptions options = new BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
                .build();
        barcodeScanner = BarcodeScanning.getClient(options);

        bindViews(view);

        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            startCamera();
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
        }
    }

    private void bindViews(View view) {
        previewView = view.findViewById(R.id.scannerPreviewView);
        progressBar = view.findViewById(R.id.scannerProgressBar);
        statusTextView = view.findViewById(R.id.scannerStatusTextView);
        scanAgainButton = view.findViewById(R.id.scanAgainButton);

        scanAgainButton.setOnClickListener(v -> resetScanner());
    }

    private void startCamera() {
        codeDetected.set(false);
        scanAgainButton.setVisibility(View.GONE);
        statusTextView.setText("Buscando código de barras…");
        progressBar.setVisibility(View.GONE);

        ListenableFuture<ProcessCameraProvider> cameraProviderFuture =
                ProcessCameraProvider.getInstance(requireContext());

        cameraProviderFuture.addListener(() -> {
            try {
                cameraProvider = cameraProviderFuture.get();
                bindCameraUseCases();
            } catch (ExecutionException | InterruptedException e) {
                statusTextView.setText("Error al iniciar la cámara.");
            }
        }, ContextCompat.getMainExecutor(requireContext()));
    }

    private void bindCameraUseCases() {
        if (cameraProvider == null || getContext() == null) {
            return;
        }

        cameraProvider.unbindAll();

        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        imageAnalysis.setAnalyzer(cameraExecutor, this::processImageProxy);

        CameraSelector cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA;

        try {
            cameraProvider.bindToLifecycle(
                    getViewLifecycleOwner(),
                    cameraSelector,
                    preview,
                    imageAnalysis
            );
        } catch (Exception e) {
            statusTextView.setText("No se pudo vincular la cámara.");
        }
    }

    @androidx.annotation.OptIn(markerClass = androidx.camera.core.ExperimentalGetImage.class)
    private void processImageProxy(ImageProxy imageProxy) {
        Image mediaImage = imageProxy.getImage();

        if (mediaImage != null && !codeDetected.get()) {
            InputImage image = InputImage.fromMediaImage(
                    mediaImage,
                    imageProxy.getImageInfo().getRotationDegrees()
            );

            barcodeScanner.process(image)
                    .addOnSuccessListener(barcodes -> {
                        if (!barcodes.isEmpty() && !codeDetected.get()) {
                            for (Barcode barcode : barcodes) {
                                String rawValue = barcode.getRawValue();
                                if (rawValue != null && !rawValue.trim().isEmpty()) {
                                    if (codeDetected.compareAndSet(false, true)) {
                                        if (getActivity() != null) {
                                            getActivity().runOnUiThread(() ->
                                                    onBarcodeDetected(rawValue.trim())
                                            );
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    })
                    .addOnCompleteListener(task -> imageProxy.close());
        } else {
            imageProxy.close();
        }
    }

    private void onBarcodeDetected(String barcode) {
        stopCamera();
        progressBar.setVisibility(View.VISIBLE);
        statusTextView.setText("Consultando código: " + barcode);

        apiService.getProductByBarcode(barcode).enqueue(new Callback<ProductResponse>() {
            @Override
            public void onResponse(
                    @NonNull Call<ProductResponse> call,
                    @NonNull Response<ProductResponse> response
            ) {
                progressBar.setVisibility(View.GONE);

                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    Product product = response.body().getData();
                    statusTextView.setText("Encontrado: " + product.getNombre());
                    showScannedProductDialog(product);
                } else {
                    statusTextView.setText("Producto no registrado (" + barcode + ")");
                    showScanAgainButton();
                }
            }

            @Override
            public void onFailure(
                    @NonNull Call<ProductResponse> call,
                    @NonNull Throwable t
            ) {
                progressBar.setVisibility(View.GONE);
                statusTextView.setText("Error al consultar el producto.");
                showScanAgainButton();
            }
        });
    }

    private void showScannedProductDialog(Product product) {
        View dialogView = LayoutInflater.from(requireContext()).inflate(
                R.layout.dialog_scanned_product,
                null
        );

        TextView nameTextView = dialogView.findViewById(R.id.scannedProductNameTextView);
        TextView codeTextView = dialogView.findViewById(R.id.scannedProductCodeTextView);
        TextView categoryTextView = dialogView.findViewById(R.id.scannedProductCategoryTextView);
        TextView priceTextView = dialogView.findViewById(R.id.scannedProductPriceTextView);
        TextView stockTextView = dialogView.findViewById(R.id.scannedProductStockTextView);
        TextView statusTextView = dialogView.findViewById(R.id.scannedProductStatusTextView);
        TextView expirationTextView = dialogView.findViewById(R.id.scannedProductExpirationTextView);

        nameTextView.setText(product.getNombre());
        codeTextView.setText("Código: " + product.getCodigoBarras());
        categoryTextView.setText(product.getCategoria());

        priceTextView.setText(currencyFormat.format(product.getPrecioVenta()));
        stockTextView.setText(formatNumber(product.getStockActual()));

        expirationTextView.setText(
                product.isControlaVencimiento()
                        ? "Controla vencimiento"
                        : "Sin control de vencimiento"
        );

        configureStatusBadge(statusTextView, product.getEstadoStock());

        AlertDialog dialog = new MaterialAlertDialogBuilder(
                requireContext(),
                R.style.ThemeOverlay_App_MaterialAlertDialog
        )
                .setView(dialogView)
                .setPositiveButton("Cerrar", null)
                .create();

        dialog.setOnShowListener(d -> {
            Button closeButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
            if (closeButton != null) {
                closeButton.setTextColor(
                        ContextCompat.getColor(requireContext(), R.color.brand_red)
                );
                closeButton.setTypeface(null, Typeface.BOLD);
            }
        });

        dialog.setOnDismissListener(d -> showScanAgainButton());

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        dialog.show();
    }

    private void configureStatusBadge(TextView badgeView, String status) {
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

        badgeView.setBackground(background);
        badgeView.setTextColor(textColor);
        badgeView.setText(label);
    }

    private void showScanAgainButton() {
        scanAgainButton.setText("Escanear nuevamente");
        scanAgainButton.setVisibility(View.VISIBLE);
        scanAgainButton.setOnClickListener(v -> resetScanner());
    }

    private void resetScanner() {
        startCamera();
    }

    private void stopCamera() {
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
        }
    }

    private void showPermissionDenied() {
        statusTextView.setText(
                "Se requiere permiso de cámara para escanear productos."
        );

        scanAgainButton.setText("Solicitar permiso");
        scanAgainButton.setVisibility(View.VISIBLE);
        scanAgainButton.setOnClickListener(
                view -> cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        );
    }

    private String formatNumber(double value) {
        if (value == Math.floor(value)) {
            return String.valueOf((long) value);
        }

        return String.format(Locale.US, "%.2f", value);
    }

    @Override
    public void onPause() {
        super.onPause();
        stopCamera();
    }

    @Override
    public void onResume() {
        super.onResume();

        if (
                getView() != null &&
                        ContextCompat.checkSelfPermission(
                                requireContext(),
                                Manifest.permission.CAMERA
                        ) == PackageManager.PERMISSION_GRANTED &&
                        !codeDetected.get()
        ) {
            startCamera();
        }
    }

    @Override
    public void onDestroyView() {
        stopCamera();

        if (barcodeScanner != null) {
            barcodeScanner.close();
        }

        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
        }

        super.onDestroyView();
    }
}
