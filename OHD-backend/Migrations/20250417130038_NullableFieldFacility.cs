using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OHD_backend.Migrations
{
    /// <inheritdoc />
    public partial class NullableFieldFacility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ShouldUpdateHeadManager",
                table: "Facilities",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShouldUpdateTechnicians",
                table: "Facilities",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShouldUpdateHeadManager",
                table: "Facilities");

            migrationBuilder.DropColumn(
                name: "ShouldUpdateTechnicians",
                table: "Facilities");
        }
    }
}
