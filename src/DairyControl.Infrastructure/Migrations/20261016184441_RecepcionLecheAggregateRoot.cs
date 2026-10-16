using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DairyControl.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RecepcionLecheAggregateRoot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Recepciones_Proveedores_ProveedorId",
                table: "Recepciones");

            migrationBuilder.DropIndex(
                name: "IX_Recepciones_ProveedorId",
                table: "Recepciones");

            migrationBuilder.CreateIndex(
                name: "IX_Recepciones_FechaHora",
                table: "Recepciones",
                column: "FechaHora");

            migrationBuilder.CreateIndex(
                name: "IX_Recepciones_ProveedorId_FechaHora",
                table: "Recepciones",
                columns: new[] { "ProveedorId", "FechaHora" });

            migrationBuilder.AddForeignKey(
                name: "FK_Recepciones_Proveedores_ProveedorId",
                table: "Recepciones",
                column: "ProveedorId",
                principalTable: "Proveedores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Recepciones_Proveedores_ProveedorId",
                table: "Recepciones");

            migrationBuilder.DropIndex(
                name: "IX_Recepciones_FechaHora",
                table: "Recepciones");

            migrationBuilder.DropIndex(
                name: "IX_Recepciones_ProveedorId_FechaHora",
                table: "Recepciones");

            migrationBuilder.CreateIndex(
                name: "IX_Recepciones_ProveedorId",
                table: "Recepciones",
                column: "ProveedorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Recepciones_Proveedores_ProveedorId",
                table: "Recepciones",
                column: "ProveedorId",
                principalTable: "Proveedores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
