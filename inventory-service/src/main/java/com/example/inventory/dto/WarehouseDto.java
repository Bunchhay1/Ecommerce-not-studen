package com.example.inventory.dto;

import com.example.inventory.entity.Warehouse;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;

public class WarehouseDto {

    private String id;

    @NotBlank(message = "Warehouse code is required")
    private String code;

    @NotBlank(message = "Warehouse name is required")
    private String name;

    private String address;
    private String city;
    private String country;
    private Boolean isActive = true;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public WarehouseDto() {
    }

    public static WarehouseDto fromEntity(Warehouse warehouse) {
        WarehouseDto dto = new WarehouseDto();
        dto.setId(warehouse.getId());
        dto.setCode(warehouse.getCode());
        dto.setName(warehouse.getName());
        dto.setAddress(warehouse.getAddress());
        dto.setCity(warehouse.getCity());
        dto.setCountry(warehouse.getCountry());
        dto.setIsActive(warehouse.getIsActive());
        dto.setCreatedAt(warehouse.getCreatedAt());
        dto.setUpdatedAt(warehouse.getUpdatedAt());
        return dto;
    }

    public Warehouse toEntity() {
        Warehouse warehouse = new Warehouse();
        warehouse.setId(this.id);
        warehouse.setCode(this.code);
        warehouse.setName(this.name);
        warehouse.setAddress(this.address);
        warehouse.setCity(this.city);
        warehouse.setCountry(this.country);
        warehouse.setIsActive(this.isActive != null ? this.isActive : true);
        return warehouse;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
