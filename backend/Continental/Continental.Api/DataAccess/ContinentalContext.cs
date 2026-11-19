using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.DataAccess;

public class ContinentalContext : DbContext
{
    public ContinentalContext(
        DbContextOptions<ContinentalContext> options
    ) : base(options)
    {
    }

    public DbSet<Rol> Roles => Set<Rol>();

    public DbSet<Usuario> Usuarios => Set<Usuario>();

    public DbSet<Categoria> Categorias => Set<Categoria>();

    public DbSet<Producto> Productos => Set<Producto>();

    public DbSet<Proveedor> Proveedores => Set<Proveedor>();

    public DbSet<Compra> Compras => Set<Compra>();

    public DbSet<CompraDetalle> CompraDetalles => Set<CompraDetalle>();

    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder
    )
    {
        base.OnModelCreating(modelBuilder);

        ConfigureRol(modelBuilder);
        ConfigureUsuario(modelBuilder);
        ConfigureCategoria(modelBuilder);
        ConfigureProducto(modelBuilder);
        ConfigureProveedor(modelBuilder);
        ConfigureCompra(modelBuilder);
        ConfigureCompraDetalle(modelBuilder);
        ConfigureMovimientoInventario(modelBuilder);
    }

    private static void ConfigureRol(
        ModelBuilder modelBuilder
    )
    {
        modelBuilder.Entity<Rol>(entity =>
        {
            entity.HasIndex(rol => rol.Nombre)
                .IsUnique();

            entity.Property(rol => rol.CreatedAt)
                .HasColumnName("creado_en")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(rol => rol.UpdatedAt)
                .HasColumnName("actualizado_en");
        });
    }

    private static void ConfigureUsuario(
        ModelBuilder modelBuilder
    )
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasIndex(usuario => usuario.Correo)
                .IsUnique();

            entity.Property(usuario => usuario.CreatedAt)
                .HasColumnName("creado_en")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(usuario => usuario.UpdatedAt)
                .HasColumnName("actualizado_en");

            entity.HasOne(usuario => usuario.Rol)
                .WithMany(rol => rol.Usuarios)
                .HasForeignKey(usuario => usuario.IdRol)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureCategoria(
        ModelBuilder modelBuilder
    )
    {
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasIndex(categoria => categoria.Nombre)
                .IsUnique();

            entity.Property(categoria => categoria.CreatedAt)
                .HasColumnName("creado_en")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(categoria => categoria.UpdatedAt)
                .HasColumnName("actualizado_en");
        });
    }

    private static void ConfigureProducto(
        ModelBuilder modelBuilder
    )
    {
        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasIndex(producto =>
                    producto.CodigoBarras)
                .IsUnique();

            entity.Property(producto =>
                    producto.PrecioCompra)
                .HasPrecision(12, 2);

            entity.Property(producto =>
                    producto.PrecioVenta)
                .HasPrecision(12, 2);

            entity.Property(producto =>
                    producto.StockActual)
                .HasPrecision(12, 2)
                .HasDefaultValue(0);

            entity.Property(producto =>
                    producto.StockMinimo)
                .HasPrecision(12, 2)
                .HasDefaultValue(0);

            entity.Property(producto =>
                    producto.CreatedAt)
                .HasColumnName("creado_en")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(producto =>
                    producto.UpdatedAt)
                .HasColumnName("actualizado_en");

            entity.HasOne(producto =>
                    producto.Categoria)
                .WithMany(categoria =>
                    categoria.Productos)
                .HasForeignKey(producto =>
                    producto.IdCategoria)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureProveedor(
        ModelBuilder modelBuilder
    )
    {
        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.HasIndex(proveedor =>
                    proveedor.Documento)
                .IsUnique();

            entity.Property(proveedor =>
                    proveedor.CreatedAt)
                .HasColumnName("creado_en")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(proveedor =>
                    proveedor.UpdatedAt)
                .HasColumnName("actualizado_en");
        });
    }

    private static void ConfigureCompra(
        ModelBuilder modelBuilder
    )
    {
        modelBuilder.Entity<Compra>(entity =>
        {
            entity.Property(compra => compra.Total)
                .HasPrecision(12, 2);

            entity.Property(compra => compra.CreatedAt)
                .HasColumnName("creado_en")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(compra => compra.UpdatedAt)
                .HasColumnName("actualizado_en");

            entity.HasOne(compra => compra.Proveedor)
                .WithMany(proveedor => proveedor.Compras)
                .HasForeignKey(compra => compra.IdProveedor)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(compra => compra.Usuario)
                .WithMany(usuario => usuario.Compras)
                .HasForeignKey(compra => compra.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(compra => compra.Fecha);
        });
    }

    private static void ConfigureCompraDetalle(
        ModelBuilder modelBuilder
    )
    {
        modelBuilder.Entity<CompraDetalle>(entity =>
        {
            entity.Property(detalle => detalle.Cantidad)
                .HasPrecision(12, 2);

            entity.Property(detalle => detalle.CostoUnitario)
                .HasPrecision(12, 2);

            entity.Property(detalle => detalle.Subtotal)
                .HasPrecision(12, 2);

            entity.Property(detalle => detalle.CreatedAt)
                .HasColumnName("creado_en")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(detalle => detalle.UpdatedAt)
                .HasColumnName("actualizado_en");

            entity.HasOne(detalle => detalle.Compra)
                .WithMany(compra => compra.Detalles)
                .HasForeignKey(detalle => detalle.IdCompra)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(detalle => detalle.Producto)
                .WithMany(producto =>
                    producto.CompraDetalles)
                .HasForeignKey(detalle =>
                    detalle.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureMovimientoInventario(
        ModelBuilder modelBuilder
    )
    {
        modelBuilder.Entity<MovimientoInventario>(entity =>
        {
            entity.Property(movimiento => movimiento.Entrada)
                .HasPrecision(12, 2);

            entity.Property(movimiento => movimiento.Salida)
                .HasPrecision(12, 2);

            entity.Property(movimiento => movimiento.Saldo)
                .HasPrecision(12, 2);

            entity.Property(movimiento => movimiento.CreatedAt)
                .HasColumnName("creado_en")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(movimiento => movimiento.UpdatedAt)
                .HasColumnName("actualizado_en");

            entity.HasOne(movimiento => movimiento.Producto)
                .WithMany(producto =>
                    producto.MovimientosInventario)
                .HasForeignKey(movimiento =>
                    movimiento.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(movimiento => movimiento.Usuario)
                .WithMany(usuario =>
                    usuario.MovimientosInventario)
                .HasForeignKey(movimiento =>
                    movimiento.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(movimiento => new
            {
                movimiento.IdProducto,
                movimiento.Fecha
            });
        });
    }

    public override int SaveChanges()
    {
        UpdateAuditFields();

        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    )
    {
        UpdateAuditFields();

        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateAuditFields()
    {
        var entries = ChangeTracker
            .Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}