using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DairyControl.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarIndiceUnicoTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Recepciones_Ticket",
                table: "Recepciones",
                column: "Ticket",
                unique: true,
                filter: "[Ticket] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Recepciones_Ticket",
                table: "Recepciones");
        }
    }
}
