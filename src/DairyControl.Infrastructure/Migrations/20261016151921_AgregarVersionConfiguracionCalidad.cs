using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DairyControl.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarVersionConfiguracionCalidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "ConfiguracionesCalidad",
                type: "rowversion",
                rowVersion: true,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "ConfiguracionesCalidad");
        }
    }
}
