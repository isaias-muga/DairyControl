using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DairyControl.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarAguaTicketYConfiguracionCalidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Parametros_AguaPorcentaje",
                table: "Recepciones",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Ticket",
                table: "Recepciones",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConfiguracionesCalidad",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Limites_AcidezMaxima = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Limites_TemperaturaMaxima = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Limites_AguaMaxima = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    ActualizadoEn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionesCalidad", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ConfiguracionesCalidad",
                columns: new[] { "Id", "ActualizadoEn", "Limites_AcidezMaxima", "Limites_AguaMaxima", "Limites_TemperaturaMaxima" },
                values: new object[] { new Guid("5b0c6f0e-3f6a-4f7e-9a53-0d1c2b7a4e11"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), 19m, 0m, 20m });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfiguracionesCalidad");

            migrationBuilder.DropColumn(
                name: "Parametros_AguaPorcentaje",
                table: "Recepciones");

            migrationBuilder.DropColumn(
                name: "Ticket",
                table: "Recepciones");
        }
    }
}
