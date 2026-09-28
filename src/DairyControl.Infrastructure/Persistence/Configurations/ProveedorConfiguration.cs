using DairyControl.Domain.Entities;
using DairyControl.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace DairyControl.Infrastructure.Persistence.Configurations
{
    internal class ProveedorConfiguration : IEntityTypeConfiguration<Proveedor>
    {
        public void Configure(EntityTypeBuilder<Proveedor> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Nombre)
                .IsRequired()
                .HasMaxLength(Proveedor.NombreMaxLength);
            builder.OwnsMany(p => p.Recepciones, r =>
            {
                r.WithOwner().HasForeignKey("ProveedorId");
                r.ToTable("Recepciones");
                r.HasKey("Id");
                r.Property(x => x.Id).ValueGeneratedNever();
                r.OwnsOne(x => x.Parametros, p =>
                {
                    p.Property(x => x.Grasa).IsRequired().HasPrecision(ParametrosCalidad.Precision, ParametrosCalidad.Scale);
                    p.Property(x => x.Acidez).IsRequired().HasPrecision(ParametrosCalidad.Precision, ParametrosCalidad.Scale);
                    p.Property(x => x.Temperatura).IsRequired().HasPrecision(ParametrosCalidad.Precision, ParametrosCalidad.Scale);
                });
            });
        }
    }
}
